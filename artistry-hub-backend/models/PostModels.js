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
});

module.exports = mongoose.model("Post", PostSchema);
