const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversations: [
      {
        query: {
          type: String,
          required: true,
        },
        response: {
          type: String,
          required: true,
        },
        suggestedVideos: [
          {
            title: String,
            url: String,
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for better query performance
ChatHistorySchema.index({ userId: 1, "conversations.timestamp": -1 });

// Method to add new conversation
ChatHistorySchema.methods.addConversation = function (
  query,
  response,
  videos = []
) {
  this.conversations.push({
    query,
    response,
    suggestedVideos: videos,
  });
  this.lastInteraction = Date.now();
  return this.save();
};

// Method to get recent conversations
ChatHistorySchema.methods.getRecentConversations = function (limit = 10) {
  return this.conversations
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

// Static method to find or create chat history for a user
ChatHistorySchema.statics.findOrCreateHistory = async function (userId) {
  let chatHistory = await this.findOne({ userId });
  if (!chatHistory) {
    chatHistory = new this({ userId, conversations: [] });
    await chatHistory.save();
  }
  return chatHistory;
};

const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);

module.exports = ChatHistory;
