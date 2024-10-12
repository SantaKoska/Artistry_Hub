const express = require("express");
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../utils/tokendec");
const Message = require("../models/MessageModels");
const Follower = require("../models/FollowerModels");
const User = require("../models/UserModel");

const router = express.Router();

// Multer configuration for different media types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (file.mimetype.startsWith("image/")) {
      uploadPath = path.join(__dirname, "../../storage/messages/images/");
    } else if (file.mimetype.startsWith("video/")) {
      uploadPath = path.join(__dirname, "../../storage/messages/videos/");
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = path.join(__dirname, "../../storage/messages/audio/");
    } else {
      return cb(new Error("Unsupported file format"), false);
    }

    // Ensure the directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

// Search for users
router.get("/search", verifyToken, async (req, res) => {
  const { query } = req.query;

  try {
    const following = await Follower.find({
      followerId: req.user.identifier,
    });
    const followingUserIds = following.map((f) => f.followingId);

    const users = await User.find({
      _id: { $in: followingUserIds },
      userName: { $regex: query, $options: "i" },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message
router.post(
  "/send-message",
  verifyToken,
  upload.array("media", 30),
  async (req, res) => {
    try {
      const { recipientId, content } = req.body;
      const sender = req.user;

      // Check if recipientId and content are provided
      if (!recipientId || !content) {
        return res
          .status(400)
          .json({ message: "Recipient ID and content are required." });
      }

      // Check if the sender follows the recipient
      const isFollowing = await Follower.findOne({
        followerId: sender.identifier,
        followingId: recipientId,
      });

      if (!isFollowing) {
        return res
          .status(400)
          .json({ message: "You can only message users you follow." });
      }

      // Check if the recipient follows the sender
      const isMutual = await Follower.findOne({
        followerId: recipientId,
        followingId: sender.identifier,
      });

      const mediaUrls = req.files
        ? req.files.map(
            (file) => `/storage/messages/${file.fieldname}/${file.filename}`
          )
        : [];

      let newMessage;

      if (!isMutual) {
        newMessage = new Message({
          sender: sender.identifier,
          recipient: recipientId,
          content,
          media: mediaUrls,
          isAccepted: false,
        });
        await newMessage.save();

        return res.status(201).json({ message: "Message sent as a request." });
      }

      newMessage = new Message({
        sender: sender.identifier,
        recipient: recipientId,
        content,
        media: mediaUrls,
        isAccepted: true,
      });
      await newMessage.save();

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// Accept message request
router.post("/accept-request", verifyToken, async (req, res) => {
  try {
    const { requesterId } = req.body;
    const user = req.user;

    // Check if the recipient already follows the requester
    const isFollowing = await Follower.findOne({
      followerId: user.identifier,
      followingId: requesterId,
    });

    if (!isFollowing) {
      // Automatically follow the requester
      await Follower.create({
        followerId: user.identifier,
        followingId: requesterId,
      });
    }

    // Accept all pending messages from the requester
    await Message.updateMany(
      { sender: requesterId, recipient: user.identifier, isAccepted: false },
      { isAccepted: true }
    );

    res.status(200).json({
      message: "Request accepted and you are now following each other.",
    });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// Retrieve message history
router.get("/message-history/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = req.user;

    const messages = await Message.find({
      $or: [
        { sender: user.identifier, recipient: userId },
        { sender: userId, recipient: user.identifier },
      ],
      isAccepted: true, // Only accepted messages are retrieved
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving message history:", error.message);
    res.status(500).json({ error: "Failed to retrieve message history" });
  }
});

// Fetch chat list (sorted by the most recent message)
router.get("/chat-list", verifyToken, async (req, res) => {
  try {
    const user = req.user;

    // Step 1: Find messages where the user is either sender or recipient and is accepted
    const messages = await Message.find({
      $or: [{ sender: user.identifier }, { recipient: user.identifier }],
      isAccepted: true,
    }).sort({ createdAt: -1 }); // Sort by createdAt to get the latest messages first

    // Step 2: Create a Map to store unique chat users
    const chatUsersMap = new Map();

    messages.forEach((message) => {
      const otherUserId = message.sender.equals(user.identifier)
        ? message.recipient
        : message.sender;

      // If the other user is not already in the map, add their last message
      if (!chatUsersMap.has(otherUserId.toString())) {
        chatUsersMap.set(otherUserId.toString(), {
          userId: otherUserId,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
        });
      }
    });

    // Step 3: Convert the map to an array of chat users
    const chatUsers = Array.from(chatUsersMap.values());

    // Step 4: Fetch user details for the chat users
    const userIds = chatUsers.map((chat) => chat.userId);
    const users = await User.find(
      { _id: { $in: userIds } },
      "userName profilePicture"
    );

    // Step 5: Combine chat information with user details
    const sortedChats = chatUsers.map((chatUser) => {
      const user = users.find(
        (u) => u._id.toString() === chatUser.userId.toString()
      );
      return {
        id: chatUser.userId,
        userName: user?.userName || "Unknown",
        profilePicture: user?.profilePicture || "",
        lastMessage: chatUser.lastMessage,
        lastMessageTime: chatUser.lastMessageTime,
      };
    });

    // console.log(sortedChats);
    res.status(200).json(sortedChats);
  } catch (error) {
    console.error("Error fetching chat list:", error.message);
    res.status(500).json({ error: "Failed to fetch chat list" });
  }
});

// Delete a message (only for the user's view)
router.delete("/delete-message/:messageId", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.sender.equals(user.identifier)) {
      return res.status(403).json({ error: "You can't delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Clear chat history
router.delete("/clear-chat/:userId", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { userId } = req.params;

    await Message.deleteMany({
      $or: [
        { sender: user.identifier, recipient: userId },
        { sender: userId, recipient: user.identifier },
      ],
    });

    res.status(200).json({ message: "Chat history cleared successfully" });
  } catch (error) {
    console.error("Error clearing chat history:", error.message);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

// Retrieve pending message requests
router.get("/pending-requests", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;
    // console.log(userId);
    const pendingMessages = await Message.find({
      recipient: userId,
      isAccepted: false,
    }).populate("sender");
    // console.log("Pending Messages:", pendingMessages);
    res.status(200).json(pendingMessages);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    // req.user contains the user id from the JWT token
    const user = await User.findById(req.user.identifier).select("-password"); // Exclude password from response
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
