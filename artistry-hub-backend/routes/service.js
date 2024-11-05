const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/ServiceRequestModels");
const ServiceProvider = require("../models/ServiceProviderModels");
const User = require("../models/UserModel");
const Post = require("../models/PostModels");
const multer = require("multer");

// Authentication
const { verifyToken } = require("../utils/tokendec");

// Get all service requests based on the service provider's expertise and filtering by specialization
router.get("/requests", verifyToken, async (req, res) => {
  const { specialization } = req.query;
  const user = req.user; // Extracted from the token

  try {
    // Find the service provider's expertise based on the user ID from the token
    const serviceProvider = await ServiceProvider.findOne({
      userId: user.identifier,
    });

    if (!serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    const artform = serviceProvider.expertise;

    // Build the query based on the expertise and specialization
    const query = {
      artForm: artform, // Filter by the expertise of the service provider
      status: "Pending", // Only show pending requests
      serviceProviderId: { $ne: user.identifier }, // Exclude requests accepted by this service provider
      _id: { $nin: serviceProvider.ignoredServiceRequests }, // Exclude requests in the ignoredServiceRequests array
    };

    if (specialization && specialization !== "All") {
      query.specialization = specialization; // Add specialization filter if provided
    }

    const requests = await ServiceRequest.find(query).populate("userId");

    res.status(200).json({ requests, artform });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching service requests", error });
  }
});

// Accept a service request
router.post("/requests/:requestId/accept", verifyToken, async (req, res) => {
  const user = req.user; // Extracted from the token
  const { requestId } = req.params;

  try {
    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Assign the service provider to the request
    serviceRequest.serviceProviderId = user.identifier; // Use identifier from the token

    await serviceRequest.save();
    res.json({ message: "Service request accepted" });
  } catch (error) {
    res.status(500).json({ message: "Error accepting service request", error });
  }
});

// Ignore a service request (mark it as ignored so it doesn't show up again)
router.post("/requests/:requestId/ignore", verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const user = req.user; // Extracted from the token

  try {
    // Find the service request by ID
    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Find the service provider and add the ignored request ID
    const serviceProvider = await ServiceProvider.findOneAndUpdate(
      { userId: user.identifier },
      { $addToSet: { ignoredServiceRequests: requestId } }, // Ensure no duplicates
      { new: true } // Return the updated document
    );

    if (!serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    res.json({ message: "Service request ignored", serviceProvider });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error ignoring service request", error });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "dp/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Get service provider profile
router.get("/service-provider-profile", verifyToken, async (req, res) => {
  try {
    const user = req.user; // extracted from token

    // Fetch profile and service provider info
    const profile = await User.findById(user.identifier);
    const serviceProvider = await ServiceProvider.findOne({
      userId: user.identifier,
    });

    if (!profile || !serviceProvider) {
      return res.status(404).json({
        err: "Profile or service provider information not found",
      });
    }

    const followerCount = await profile.getNumberOfFollowers();
    const postsInfo = await Post.find({ user: user.identifier }).sort({
      timestamp: -1,
    });

    // Return combined profile and service provider information
    res.json({
      ...profile.toObject(),
      ...serviceProvider.toObject(),
      userName: profile.userName,
      followerCount,
      postsInfo,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ err: "Server error" });
  }
});

// Update service provider profile
router.put(
  "/service-provider-editprofile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const user = req.user;
      const { description, expertise, ownerName, userName } = req.body;

      // Fetch user and service provider information
      const userRecord = await User.findById(user.identifier);
      const serviceProvider = await ServiceProvider.findOne({
        userId: user.identifier,
      });

      if (!userRecord || !serviceProvider) {
        return res.status(404).json({
          err: "Service provider or user not found",
        });
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

      // Check for userName update restrictions
      if (userName && userName !== userRecord.userName) {
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
          return res.status(400).json({
            err: "Username already exists, please choose a different one",
          });
        }
        if (userRecord.updatedAt < oneWeekAgo) {
          userRecord.userName = userName;
        } else {
          return res
            .status(403)
            .json({ err: "You can only update the username once a week" });
        }
      }

      // Expertise update restriction
      if (expertise && expertise !== serviceProvider.expertise) {
        if (serviceProvider.updatedAt < oneWeekAgo) {
          serviceProvider.expertise = expertise;
        } else {
          return res
            .status(403)
            .json({ err: "You can only update the expertise once a week" });
        }
      }

      // Update profile picture and description without restrictions
      if (req.file) {
        userRecord.profilePicture = `/dp/${req.file.filename}`;
      }
      if (description) userRecord.description = description;

      await userRecord.save();
      await serviceProvider.save();

      res.json({ success: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ err: "Server error" });
    }
  }
);

module.exports = router;
