const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/PostModels");
const router = express.Router();

// Set up multer storage for different media types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "post/image/");
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, "post/video/");
    } else if (file.mimetype.startsWith("audio/")) {
      cb(null, "post/audio/");
    } else {
      cb({ message: "Unsupported file format" }, false);
    }
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
      const user = req.user.identifier;

      const mediaUrl = req.file
        ? `/post/${mediaType}/${req.file.filename}`
        : null;

      const newPost = new Post({
        content,
        mediaUrl,
        mediaType,
        user,
      });

      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating post: ", error.message);
      res.status(500).json({ error: "Failed to create post" });
    }
  }
);

module.exports = router;
