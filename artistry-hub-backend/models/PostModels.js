const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  mediaUrl: {
    type: String,
  },
  mediaType: {
    type: String,
    enum: ["image", "video", "audio"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      gifUrl: {
        type: String,
      },
      gifId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      likes: {
        type: Number,
        default: 0,
      },
      likedBy: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  ],
  isAgeRestricted: {
    type: Boolean,
    default: false,
  },
  moderationScore: {
    type: Number,
    default: 0,
  },
  moderationWarnings: [
    {
      type: String,
    },
  ],
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
