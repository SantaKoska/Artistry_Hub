const express = require("express");
const router = express.Router();
const User = require("../models/UserModel"); // User model
const Institution = require("../models/InstituationModels"); // Institution model
const Post = require("../models/PostModels");
const Follower = require("../models/FollowerModels");
const path = require("path");
const multer = require("multer");

// Authentication
const { verifyToken } = require("../utils/tokendec");

// Get institution profile
router.get("/institution-profile", verifyToken, async (req, res) => {
  try {
    const user = req.user; // Extracted from token

    // Fetch profile from User and Institution models
    const profile = await User.findOne({ _id: user.identifier });
    const institution = await Institution.findOne({ userId: user.identifier });

    if (!profile || !institution) {
      return res
        .status(404)
        .json({ err: "Profile or institution information not found" });
    }

    const followerCount = await profile.getNumberOfFollowers();

    // Fetch posts created by the institution
    const postsinfo = await Post.find({ user: user.identifier }).sort({
      timestamp: -1,
    });

    // Extract institution location details
    const { location } = institution;

    res.json({
      userName: profile.userName,
      profilePicture: profile.profilePicture,
      followerCount,
      postsinfo,
      registeredUnder: institution.registeredUnder,
      registrationID: institution.registrationID,
      location: location
        ? {
            address: location.address || "",
            district: location.district || "",
            state: location.state || "",
            country: location.country || "",
            postalCode: location.postalCode || "",
          }
        : {},
    });
  } catch (error) {
    console.error("Error fetching institution profile:", error);
    res.status(500).json({ err: "Server error" });
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "dp/"); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Append timestamp
  },
});
const upload = multer({ storage });

// Update institution profile
router.put(
  "/institution-editprofile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const user = req.user; // Extracted from token
      const { description, type, focusArea, userName } = req.body;

      // Fetch user and institution records
      const userRecord = await User.findById(user.identifier);
      const institution = await Institution.findOne({
        userId: user.identifier,
      });

      if (!userRecord || !institution) {
        return res.status(404).json({ err: "Institution or user not found" });
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

      // Update userName with restrictions
      if (userName && userName !== userRecord.userName) {
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
          return res
            .status(400)
            .json({ err: "Username already exists, choose a different one" });
        }
        if (userRecord.updatedAt < oneWeekAgo) {
          userRecord.userName = userName;
        } else {
          return res.status(403).json({
            err: "You can only update the username once a week",
          });
        }
      }

      // Update type with restrictions
      if (type && type !== institution.type) {
        if (institution.updatedAt < oneWeekAgo) {
          institution.type = type;
        } else {
          return res.status(403).json({
            err: "You can only update the institution type once a week",
          });
        }
      }

      // Update focus area with restrictions
      if (focusArea && focusArea !== institution.focusArea) {
        if (institution.updatedAt < oneWeekAgo) {
          institution.focusArea = focusArea;
        } else {
          return res.status(403).json({
            err: "You can only update the focus area once a week",
          });
        }
      }

      // Update description and profile picture without restrictions
      if (req.file) {
        userRecord.profilePicture = `/dp/${req.file.filename}`;
      }
      if (description) userRecord.description = description;

      // Save changes
      await userRecord.save();
      await institution.save();

      res.json({ success: "Institution profile updated successfully" });
    } catch (error) {
      console.error("Error updating institution profile:", error);
      res.status(500).json({ err: "Server error" });
    }
  }
);

// Fetch home posts for institution
router.get("/institution-homeposts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Get posts from followed institutions
    const followedInstitutions = await Follower.find({
      followerId: userId,
    }).select("followingId");
    const followedInstitutionIds = followedInstitutions.map(
      (f) => f.followingId
    );

    // Fetch the latest 10 posts from followed institutions
    const followedPosts = await Post.find({
      user: { $in: followedInstitutionIds },
    })
      .populate("user")
      .sort({ timestamp: -1 })
      .limit(10);

    // Fetch the latest 10 posts from other institutions
    const nonFollowedPosts = await Post.find({
      user: { $nin: followedInstitutionIds.concat([userId]) },
    })
      .populate("user")
      .sort({ timestamp: -1 })
      .limit(10);

    // Combine posts
    const posts = [...followedPosts, ...nonFollowedPosts];

    res.json({ posts, userId });
  } catch (error) {
    console.error("Error fetching institution posts:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
