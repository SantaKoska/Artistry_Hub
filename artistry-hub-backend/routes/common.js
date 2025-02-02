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

// Fetch user profile by username
router.get("/profile/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.params.username })
      .populate("posts.postId") // Fetch associated posts
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get follower count using the schema method
    const followerCount = await user.getNumberOfFollowers();

    // Get the current user and their following list
    const currentUser = await User.findById(req.user.identifier).populate(
      "following"
    );
    const followingIds = currentUser.following.map((following) =>
      following._id.toString()
    );

    // Check if the current user is following the profile user
    const isFollowing = followingIds.includes(user._id.toString());

    // Fetch additional data based on the user's role
    let additionalData = {};

    switch (user.role) {
      case "Artist":
        const artistData = await Artist.findOne({ userId: user._id });
        additionalData = {
          artForm: artistData.artForm,
          specialisation: artistData.specialisation,
        };
        break;

      case "Viewer/Student":
        const viewerStudentData = await ViewerStudent.findOne({
          userId: user._id,
        });
        additionalData = {
          coursesEnrolled: viewerStudentData.coursesEnrolled,
          favoriteArtists: viewerStudentData.artForm,
        };
        break;

      case "Institution":
        const institutionData = await Institution.findOne({ userId: user._id });
        additionalData = {
          institutionName: institutionData.institutionName,
          location: institutionData.location,
          // Add other institution-specific fields here
        };
        break;

      case "Service Provider":
        const serviceProviderData = await ServiceProvider.findOne({
          userId: user._id,
        });
        additionalData = {
          ownerName: serviceProviderData.ownerName,
          expertise: serviceProviderData.expertise,
          location: serviceProviderData.location.address,
          district: serviceProviderData.location.district,
          state: serviceProviderData.location.state,
          country: serviceProviderData.location.country,
          postalCode: serviceProviderData.location.postalCode,
        };
        break;

      default:
        additionalData = {}; // Default case for roles not specified
    }

    res.json({
      profile: {
        userName: user.userName,
        profilePicture: user.profilePicture,
        description: user.description,
        role: user.role,
        followerCount,
        numberOfPosts: user.numberOfPosts,
        following: isFollowing, // Updated to check if following
        ...additionalData,
      },
      posts: user.posts.map((postObj) => postObj.postId), // Send the post details
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
    const userId = req.user.identifier; // Assuming the token contains user ID
    const user = await User.findById(userId).select(
      "userName role profilePicture"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send back the user's username, role, and profile picture
    res.json({
      profile: {
        userName: user.userName,
        role: user.role,
        profilePicture: user.profilePicture, // Include the profile picture
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

module.exports = router;
