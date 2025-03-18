const express = require("express");
const router = express.Router();
const Post = require("../models/PostModels");
const { verifyToken } = require("../utils/tokendec");

// Add a comment to a post
router.post("/:postId/comment", verifyToken, async (req, res) => {
  const { content, gifUrl, gifId } = req.body;
  const userId = req.user.identifier;

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      user: userId,
      content,
      gifUrl,
      gifId,
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch comments for a post
router.get("/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "comments.user"
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Like or unlike a comment
router.post(
  "/:postId/comments/:commentId/like",
  verifyToken,
  async (req, res) => {
    const userId = req.user.identifier;
    const { commentId } = req.params;

    try {
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if the user has already liked the comment
      const likedIndex = comment.likedBy.indexOf(userId);
      if (likedIndex > -1) {
        // User has already liked the comment, so we remove the like
        comment.likedBy.splice(likedIndex, 1);
        comment.likes -= 1; // Decrease the like count
      } else {
        // User has not liked the comment, so we add the like
        comment.likedBy.push(userId);
        comment.likes += 1; // Increase the like count
      }

      await post.save();
      res.status(200).json(comment);
    } catch (error) {
      console.error("Error liking/unliking comment:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
