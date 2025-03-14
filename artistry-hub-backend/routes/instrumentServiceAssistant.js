const express = require("express");
const OpenAI = require("openai");
const axios = require("axios");
const { verifyToken } = require("../utils/tokendec");
const ChatHistory = require("../models/ChatHistoryModel");
require("dotenv").config();

const router = express.Router();
const klusterApiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({
  apiKey: klusterApiKey,
  baseURL: "https://api.kluster.ai/v1",
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const GREETING_KEYWORDS = [
  "hello",
  "hi",
  "hai",
  "hey",
  "greetings",
  "good morning",
  "good afternoon",
  "good evening",
];
const INSTRUMENT_KEYWORDS = [
  "violin",
  "guitar",
  "piano",
  "drums",
  "flute",
  "saxophone",
  "trumpet",
  "cello",
  "bass",
];
const SERVICE_KEYWORDS = [
  "clean",
  "repair",
  "damage",
  "service",
  "maintain",
  "fix",
  "restore",
  "tune",
  "polish",
];

const INVALID_QUERY_RESPONSES = [
  "I'm here to help with musical instrument service and maintenance. Could you please rephrase your question to include specific instruments or services?",
  "I specialize in musical instrument care and maintenance. Please ask me about specific instruments or services you need help with.",
  "I'd love to assist you with instrument-related queries. Could you mention which instrument or service you're interested in?",
  "To better help you, please include the name of the instrument or the type of service you're looking for.",
  "I'm your instrument service assistant! Just mention any instrument or service you need help with, and I'll guide you.",
];

const containsKeywords = (text, keywordList) => {
  return keywordList.some((keyword) =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
};

const getRandomResponse = (responses) => {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Apply verifyToken to individual routes instead of router.use()
router.post("/instrument-service", verifyToken, async (req, res) => {
  const { messages, query } = req.body;
  const userId = req.user.identifier;

  try {
    // Validate input
    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "Messages are required." });
    }

    // Check if query contains valid keywords
    const hasGreeting = containsKeywords(query, GREETING_KEYWORDS);
    const hasInstrument = containsKeywords(query, INSTRUMENT_KEYWORDS);
    const hasService = containsKeywords(query, SERVICE_KEYWORDS);

    // If no valid keywords found, return random pre-defined message
    if (!hasGreeting && !hasInstrument && !hasService) {
      const randomResponse = getRandomResponse(INVALID_QUERY_RESPONSES);

      // Store the interaction in chat history
      const chatHistory = await ChatHistory.findOrCreateHistory(userId);
      await chatHistory.addConversation(query, randomResponse);

      return res.json({
        aiText: randomResponse,
        isPreDefinedResponse: true,
      });
    }

    // Only proceed with AI call if there's at least one valid keyword
    const completion = await client.chat.completions.create({
      model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_completion_tokens: 2000,
      temperature: 1,
      top_p: 1,
      messages: messages,
    });

    const parsedCompletion =
      typeof completion === "string" ? JSON.parse(completion) : completion;
    const aiResponse = parsedCompletion.choices[0].message.content;
    // console.log("AI Response:", aiResponse);
    if (!aiResponse) {
      console.error(
        "No valid response content from Kluster AI:",
        parsedCompletion
      );
      return res.status(500).json({
        message: "No valid response content from Kluster AI",
        details: parsedCompletion,
      });
    }

    // Store the interaction with videos if present
    const chatHistory = await ChatHistory.findOrCreateHistory(userId);

    // Only perform YouTube search if query contains instrument or service keywords
    if ((hasInstrument || hasService) && query) {
      // console.log("Performing YouTube search for query:", query);
      try {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              part: "snippet",
              q: query,
              maxResults: 5,
              type: "video",
              key: YOUTUBE_API_KEY,
            },
          }
        );

        const videos = response.data.items.map((item) => ({
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

        await chatHistory.addConversation(query, aiResponse, videos);

        return res.json({
          aiText: aiResponse,
          videos,
          chatHistory: await chatHistory.getRecentConversations(),
        });
      } catch (youtubeError) {
        console.error("Error during YouTube API call:", youtubeError);
        await chatHistory.addConversation(query, aiResponse, []);
        return res.json({
          aiText: aiResponse,
          chatHistory: await chatHistory.getRecentConversations(),
        });
      }
    } else {
      // For greeting-only queries, store without videos
      await chatHistory.addConversation(query, aiResponse, []);
      return res.json({
        aiText: aiResponse,
        chatHistory: await chatHistory.getRecentConversations(),
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.get("/chat-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;
    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.json({ conversations: [] });
    }

    const conversations = await chatHistory.getRecentConversations(20);
    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      message: "Error fetching chat history",
      error: error.message,
    });
  }
});

router.delete("/chat-history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;
    await ChatHistory.findOneAndDelete({ userId });
    res.json({ message: "Chat history deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    res.status(500).json({
      message: "Error deleting chat history",
      error: error.message,
    });
  }
});

module.exports = router;
