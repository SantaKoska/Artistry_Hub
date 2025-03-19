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
      numberOfPosts: postsinfo.length,
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
    const { mediaType, sortBy } = req.query;

    // Get posts from followed institutions
    const followedInstitutions = await Follower.find({
      followerId: userId,
    }).select("followingId");
    const followedInstitutionIds = followedInstitutions.map(
      (f) => f.followingId
    );

    // Build the query based on filters
    let query = {
      user: { $in: followedInstitutionIds },
    };

    // Add mediaType filter if specified
    if (mediaType && mediaType !== "all") {
      query.mediaType = mediaType;
    }

    // Create the base query
    let followedPostsQuery = Post.find(query).populate("user");

    // Apply sorting
    switch (sortBy) {
      case "trending":
        followedPostsQuery = followedPostsQuery.sort({
          likes: -1,
          timestamp: -1,
        });
        break;
      case "oldest":
        followedPostsQuery = followedPostsQuery.sort({ timestamp: 1 });
        break;
      case "newest":
      default:
        followedPostsQuery = followedPostsQuery.sort({ timestamp: -1 });
        break;
    }

    const followedPosts = await followedPostsQuery.limit(10);

    // Similar query for non-followed posts
    let nonFollowedQuery = {
      user: { $nin: followedInstitutionIds.concat([userId]) },
    };

    if (mediaType && mediaType !== "all") {
      nonFollowedQuery.mediaType = mediaType;
    }

    let nonFollowedPostsQuery = Post.find(nonFollowedQuery).populate("user");

    // Apply the same sorting
    switch (sortBy) {
      case "trending":
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({
          likes: -1,
          timestamp: -1,
        });
        break;
      case "oldest":
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({ timestamp: 1 });
        break;
      case "newest":
      default:
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({ timestamp: -1 });
        break;
    }

    const nonFollowedPosts = await nonFollowedPostsQuery.limit(100);

    // Combine posts
    const posts = [...followedPosts, ...nonFollowedPosts];

    res.json({ posts, userId });
  } catch (error) {
    console.error("Error fetching institution posts:", error);
    res.status(500).send("Server Error");
  }
});

// Add post analytics route
router.get("/post-analytics", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Get all posts by the institution with populated comments
    const userPosts = await Post.find({ user: userId })
      .populate("comments.user")
      .populate("likedBy")
      .sort({ timestamp: -1 });

    // Get institution data with followers count
    const userData = await User.findById(userId);
    const followersCount = await userData.getNumberOfFollowers();

    // Calculate total engagement metrics
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = userPosts.reduce(
      (sum, post) => sum + post.comments.length,
      0
    );

    // Find most engaged post
    const mostEngagedPost = userPosts.reduce(
      (prev, current) => {
        const prevEngagement = prev.likes + prev.comments.length;
        const currentEngagement = current.likes + current.comments.length;
        return prevEngagement > currentEngagement ? prev : current;
      },
      { likes: 0, comments: [] }
    );

    // Calculate recent engagement (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = userPosts.filter(
      (post) => post.timestamp >= sevenDaysAgo
    );
    const olderPosts = userPosts.filter(
      (post) => post.timestamp < sevenDaysAgo
    );

    // Calculate engagement rates
    const recentEngagementRate =
      recentPosts.length > 0
        ? (recentPosts.reduce((sum, post) => {
            const postEngagement = post.likes + post.comments.length;
            return sum + postEngagement;
          }, 0) /
            recentPosts.length /
            followersCount) *
          100
        : 0;

    const olderEngagementRate =
      olderPosts.length > 0
        ? (olderPosts.reduce((sum, post) => {
            const postEngagement = post.likes + post.comments.length;
            return sum + postEngagement;
          }, 0) /
            olderPosts.length /
            followersCount) *
          100
        : 0;

    // Calculate unique engagers
    const uniqueEngagers = new Set();
    userPosts.forEach((post) => {
      post.likedBy.forEach((user) => uniqueEngagers.add(user._id.toString()));
      post.comments.forEach((comment) =>
        uniqueEngagers.add(comment.user._id.toString())
      );
    });

    const interactionTrend =
      recentEngagementRate > olderEngagementRate
        ? "up"
        : recentEngagementRate < olderEngagementRate
        ? "down"
        : "stable";

    res.json({
      totalPosts: userPosts.length,
      totalLikes,
      totalComments,
      uniqueEngagers: uniqueEngagers.size,
      mostEngagedPost:
        mostEngagedPost.likes > 0
          ? {
              content: mostEngagedPost.content,
              likes: mostEngagedPost.likes,
              comments: mostEngagedPost.comments.length,
              totalEngagement:
                mostEngagedPost.likes + mostEngagedPost.comments.length,
              mediaUrl: mostEngagedPost.mediaUrl,
              mediaType: mostEngagedPost.mediaType,
            }
          : null,
      recentEngagement: Math.round(recentEngagementRate * 100) / 100,
      interactionTrend,
      engagementMetrics: {
        averageLikesPerPost: totalLikes / userPosts.length || 0,
        averageCommentsPerPost: totalComments / userPosts.length || 0,
        followerEngagementRate:
          (uniqueEngagers.size / followersCount) * 100 || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching post analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

module.exports = router;
