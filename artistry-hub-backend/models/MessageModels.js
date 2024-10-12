const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: false,
  }, // For text messages
  media: {
    type: [String], // Changed to an array of strings to handle multiple media files
    required: false,
    default: [],
  }, // For media (image/video/audio paths)
  mediaType: {
    type: String,
    enum: ["image", "video", "audio"],
    required: false,
  }, // Media type
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAccepted: {
    type: Boolean,
    default: false,
  },
  deletedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
  }, // To mark who deleted the message
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
