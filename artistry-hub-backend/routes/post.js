const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/PostModels");
const User = require("../models/UserModel"); // Updated to use the combined User model
const router = express.Router();

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

router.post(
  "/create-post",
  verifyToken,
  upload.single("media"),
  async (req, res) => {
    try {
      const { content, mediaType } = req.body;
      const user = req.user;

      const mediaUrl = req.file
        ? `/storage/post/${mediaType}/${req.file.filename}`
        : null;

      const newPost = new Post({
        content,
        mediaUrl,
        mediaType,
        user: user.identifier,
      });

      // save the post
      await newPost.save();

      // finding the user and adding post id to their posts
      await User.findByIdAndUpdate(
        user.identifier, // find the user by identifier
        { $push: { posts: { postId: newPost._id } } }, // push the new postId to the posts array
        { new: true, useFindAndModify: false } // return the updated document
      );

      res.status(201).json(newPost);
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
      return res.status(403).json({ error: "you can’t delete this post" }); // if not, show error
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
