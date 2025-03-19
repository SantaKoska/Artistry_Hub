const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");
const Post = require("../models/ArtistModels");
const Artist = require("../models/ArtistModels");
const ViewerStudent = require("../models/Viewer-StudentModel");
const Institution = require("../models/InstituationModels");
const ServiceProvider = require("../models/ServiceProviderModels");
const Follower = require("../models/FollowerModels");
const ArtFormSpecialization = require("../models/ArtFormSpecializationModels");
const { verifyToken } = require("../utils/tokendec");
const axios = require("axios");

// Fetch user profile by username
router.get("/profile/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.params.username })
      .populate("posts.postId")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followerCount = await user.getNumberOfFollowers();
    const currentUser = await User.findById(req.user.identifier).populate(
      "following"
    );
    const followingIds = currentUser.following.map((following) =>
      following._id.toString()
    );
    const isFollowing = followingIds.includes(user._id.toString());

    // Fetch additional data based on the user's role
    let additionalData = {};

    switch (user.role) {
      case "Artist":
        const artistData = await Artist.findOne({ userId: user._id });
        additionalData = {
          artForm: artistData?.artForm || "",
          specialisation: artistData?.specialisation || "",
        };
        break;

      case "Viewer/Student":
        const viewerStudentData = await ViewerStudent.findOne({
          userId: user._id,
        });
        additionalData = {
          artForm: viewerStudentData?.artForm || "",
          coursesEnrolled: viewerStudentData?.coursesEnrolled || [],
        };
        break;

      case "Institution":
        const institutionData = await Institution.findOne({ userId: user._id });
        additionalData = {
          registeredUnder: institutionData?.registeredUnder || "",
          registrationID: institutionData?.registrationID || "",
          district: institutionData?.location?.district || "",
          state: institutionData?.location?.state || "",
          country: institutionData?.location?.country || "",
          postalCode: institutionData?.location?.postalCode || "",
        };
        break;

      case "Service Provider":
        const serviceProviderData = await ServiceProvider.findOne({
          userId: user._id,
        });
        additionalData = {
          ownerName: serviceProviderData?.ownerName || "",
          expertise: serviceProviderData?.expertise || "",
          address: serviceProviderData?.location?.address || "",
          district: serviceProviderData?.location?.district || "",
          state: serviceProviderData?.location?.state || "",
          country: serviceProviderData?.location?.country || "",
          postalCode: serviceProviderData?.location?.postalCode || "",
        };
        break;

      default:
        additionalData = {};
    }

    // Format posts data
    const formattedPosts = user.posts.map((postObj) => {
      const post = postObj.postId;
      // Convert likes to array if it exists, otherwise use empty array
      const likesArray = Array.isArray(post.likes) ? post.likes : [];

      return {
        _id: post._id,
        content: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        timestamp: post.timestamp,
        likes: likesArray.length || 0,
        liked: likesArray.includes(req.user.identifier) || false,
        isAgeRestricted: post.isAgeRestricted || false,
      };
    });

    res.json({
      profile: {
        userName: user.userName,
        profilePicture: user.profilePicture,
        description: user.description,
        role: user.role,
        followerCount,
        numberOfPosts: user.numberOfPosts,
        following: isFollowing,
        ...additionalData,
      },
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Follow/Unfollow a user
router.post("/profile/:username/follow", verifyToken, async (req, res) => {
  try {
    const userToFollow = await User.findOne({
      userName: req.params.username,
    });
    const currentUser = req.user;

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const followRecord = await Follower.findOne({
      followerId: currentUser.identifier,
      followingId: userToFollow._id,
    });

    if (followRecord) {
      // If already following, unfollow the user
      await Follower.findOneAndDelete({
        followerId: currentUser.identifier,
        followingId: userToFollow._id,
      });

      // Update the current user's following list
      await User.findByIdAndUpdate(currentUser.identifier, {
        $pull: { following: userToFollow._id },
      });

      return res.json({
        following: false,
        message: "Unfollowed successfully",
      });
    } else {
      // If not following, create a new follower document
      const newFollow = new Follower({
        followerId: currentUser.identifier,
        followingId: userToFollow._id,
      });
      await newFollow.save();

      // Update the current user's following list
      await User.findByIdAndUpdate(currentUser.identifier, {
        $addToSet: { following: userToFollow._id },
      });

      return res.json({ following: true, message: "Followed successfully" });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/usericon", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;
    const user = await User.findById(userId).select(
      "userName role profilePicture"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      profile: {
        userName: user.userName,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/specializations/:artForm", (req, res) => {
  const { artForm } = req.params;
  // Query database to get specializations for the given art form
  ArtFormSpecialization.findOne({ artForm })
    .then((artFormSpecialization) => {
      if (!artFormSpecialization) {
        return res
          .status(404)
          .json({ message: "No specializations found for this art form" });
      }
      res.json(artFormSpecialization.specializations);
    })
    .catch((err) => res.status(500).json({ error: "Error fetching data" }));
});

router.get("/art-forms", async (req, res) => {
  try {
    const artForms = await ArtFormSpecialization.find({});
    res.json(artForms.map((form) => form.artForm));
  } catch (error) {
    res.status(500).json({ message: "Error fetching art forms", error });
  }
});

// Endpoint to get specializations based on art form
router.get("/art-forms/:artForm", async (req, res) => {
  try {
    const artForm = await ArtFormSpecialization.findOne({
      artForm: req.params.artForm,
    });
    if (!artForm) {
      return res.status(404).json({ message: "Art form not found" });
    }
    res.json(artForm);
  } catch (error) {
    res.status(500).json({ message: "Error fetching specializations", error });
  }
});

// Update the followers endpoint
router.get("/followers", verifyToken, async (req, res) => {
  try {
    // First find all follower records and populate follower data
    const followers = await Follower.find({
      followingId: req.user.identifier,
    }).populate({
      path: "followerId",
      select: "userName profilePicture",
    });

    // Filter out any null records and map the data
    const formattedFollowers = await Promise.all(
      followers
        .filter((follower) => follower.followerId) // Filter out null followerId
        .map(async (follower) => {
          try {
            const artistData = await Artist.findOne({
              userId: follower.followerId._id,
            });

            return {
              _id: follower.followerId._id,
              userName: follower.followerId.userName,
              profilePicture: follower.followerId.profilePicture,
              artForm: artistData?.artForm || "",
              specialisation: artistData?.specialisation || "",
            };
          } catch (error) {
            console.error("Error processing follower:", error);
            return null;
          }
        })
    );

    // Filter out any null results from the mapping
    const validFollowers = formattedFollowers.filter(
      (follower) => follower !== null
    );

    res.json(validFollowers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ err: "Error fetching followers" });
  }
});

// Add geocoding endpoint
router.post("/geocode", verifyToken, async (req, res) => {
  try {
    const { location } = req.body;

    // For India, use a more structured query format
    if (location.country === "India") {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            street: location.address,
            city: location.district,
            state: location.state,
            country: location.country,
            postalcode: location.postalCode,
            format: "json",
            addressdetails: 1,
            limit: 1,
            countrycodes: "in", // Limit to India
          },
          headers: {
            "User-Agent": "ArtistryHub/1.0",
          },
        }
      );

      console.log("Nominatim structured response:", response.data);

      if (response.data && response.data[0]) {
        res.json({
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
        });
        return;
      }
    }

    // If structured search fails or it's not India, try with combined address
    const addressParts = [
      location.address,
      location.district,
      location.state,
      location.country,
      location.postalCode,
    ].filter((part) => part && part.trim());

    const address = addressParts.join(", ");
    console.log("Geocoding address:", address);

    // Try with postal code focused search first
    const postalCodeResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${location.postalCode}, ${location.district}, ${location.state}, India`,
          format: "json",
          addressdetails: 1,
          limit: 1,
          countrycodes: "in",
        },
        headers: {
          "User-Agent": "ArtistryHub/1.0",
        },
      }
    );

    if (postalCodeResponse.data && postalCodeResponse.data[0]) {
      res.json({
        latitude: parseFloat(postalCodeResponse.data[0].lat),
        longitude: parseFloat(postalCodeResponse.data[0].lon),
      });
      return;
    }

    // If all attempts fail, try with district level search
    const districtResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: `${location.district}, ${location.state}, India`,
          format: "json",
          addressdetails: 1,
          limit: 1,
          countrycodes: "in",
        },
        headers: {
          "User-Agent": "ArtistryHub/1.0",
        },
      }
    );

    if (districtResponse.data && districtResponse.data[0]) {
      res.json({
        latitude: parseFloat(districtResponse.data[0].lat),
        longitude: parseFloat(districtResponse.data[0].lon),
      });
    } else {
      res.status(404).json({
        message: "Location not found",
        searchedAddress: address,
      });
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      message: "Error geocoding address",
      error: error.message,
    });
  }
});

module.exports = router;
