const express = require("express");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const Post = require("../models/PostModels");
const User = require("../models/UserModel"); // Updated to use the combined User model
const router = express.Router();

// Add these constants at the top after the imports
const MODERATION_API_URL = "http://localhost:5000/api/moderate";
const MODERATION_TIMEOUT = 30000; // 30 seconds timeout

// set up multer storage for different media types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (file.mimetype.startsWith("image/")) {
      uploadPath = path.join(__dirname, "../../storage/post/image/");
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = path.join(__dirname, "../../storage/post/video/");
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = path.join(__dirname, "../../storage/post/audio/");
    } else {
      return cb({ message: "Unsupported file format" }, false);
    }

    // Ensure the directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const { verifyToken } = require("../utils/tokendec");

const upload = multer({ storage: storage });

// Update the moderateContent middleware
const moderateContent = async (req, res, next) => {
  if (
    !req.file ||
    (!req.file.mimetype.startsWith("image/") &&
      !req.file.mimetype.startsWith("video/"))
  ) {
    return next();
  }

  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path), {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(MODERATION_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: MODERATION_TIMEOUT,
    });

    // Add moderation results to request object
    req.contentModeration = response.data;

    // Instead of rejecting unsafe content, we'll just pass the moderation results
    // to the next middleware where we'll handle age restriction
    next();
  } catch (error) {
    console.error("Content moderation error:", error);
    // Clean up the uploaded file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: "Content moderation failed",
        details: error.response.data,
      });
    }

    res.status(500).json({
      error: "Content moderation service unavailable",
      details: error.message,
    });
  }
};

// Update the create-post route to handle moderation results
router.post(
  "/create-post",
  verifyToken,
  upload.single("media"),
  moderateContent,
  async (req, res) => {
    try {
      const { content, mediaType } = req.body;
      const user = req.user;

      const mediaUrl = req.file
        ? `/storage/post/${mediaType}/${req.file.filename}`
        : null;

      // Get moderation results if available
      const moderationResults = req.contentModeration || {
        is_safe: true,
        inappropriate_score: 0,
        warnings: [],
      };

      // Updated age restriction logic:
      // - If content is not safe (high inappropriate score), mark as age restricted
      // - If content has medium score (0.3 to threshold), also mark as age restricted
      const isAgeRestricted =
        !moderationResults.is_safe ||
        moderationResults.inappropriate_score > 0.3;

      // Create post with moderation data
      const newPost = new Post({
        content,
        mediaUrl,
        mediaType,
        user: user.identifier,
        isAgeRestricted: isAgeRestricted,
        moderationScore: moderationResults.inappropriate_score || 0,
        moderationWarnings: moderationResults.warnings || [],
      });

      // save the post
      await newPost.save();

      // finding the user and adding post id to their posts
      await User.findByIdAndUpdate(
        user.identifier,
        { $push: { posts: { postId: newPost._id } } },
        { new: true, useFindAndModify: false }
      );

      // Return the post with detailed moderation info
      res.status(201).json({
        ...newPost.toJSON(),
        moderation: {
          isAgeRestricted,
          score: moderationResults.inappropriate_score,
          warnings: moderationResults.warnings,
          isSafe: moderationResults.is_safe,
        },
      });
    } catch (error) {
      console.error("Error creating post: ", error.message);
      res.status(500).json({ error: "Failed to create post" });
    }
  }
);

// delete a post
router.delete("/delete-post/:postId", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "post not found" }); // if post not there, show error
    }

    // check  post belongs to user
    if (!post.user.equals(user.identifier)) {
      return res.status(403).json({ error: "you can't delete this post" }); // if not, show error
    }

    // delete the post
    await Post.findByIdAndDelete(postId);

    // remove post id userposts
    await User.findByIdAndUpdate(
      user.identifier,
      { $pull: { posts: { postId } } }, // pull postId posts array
      { new: true, useFindAndModify: false }
    );

    res.status(200).json({ message: "post deleted successfully" });
  } catch (error) {
    console.error("error deleting post: ", error.message);
    res.status(500).json({ error: "failed to delete post" });
  }
});

router.post("/:postId/toggle-like", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;
    const { postId } = req.params;

    // find the post by its ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // check if user liked the post
    const isLiked = post.likedBy.includes(userId);

    if (isLiked) {
      // user liked so unlike the post
      post.likes -= 1;
      post.likedBy = post.likedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      await post.save();

      return res
        .status(200)
        .json({ message: "Post unliked", likes: post.likes });
    } else {
      // user did not like the post so post taken to like
      post.likes += 1;
      post.likedBy.push(userId);
      await post.save();

      return res.status(200).json({ message: "Post liked", likes: post.likes });
    }
  } catch (error) {
    console.error("Error toggling like:", error.message);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

module.exports = router;
