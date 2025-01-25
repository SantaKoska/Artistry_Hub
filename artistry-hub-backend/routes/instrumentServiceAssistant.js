const express = require("express");
const OpenAI = require("openai");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const klusterApiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({
  apiKey: klusterApiKey,
  baseURL: "https://api.kluster.ai/v1",
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

router.post("/instrument-service", async (req, res) => {
  const { messages, query } = req.body;

  // console.log("Incoming request body:", req.body);

  try {
    // Validate input
    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "Messages are required." });
    }

    // Get AI response using Kluster AI
    const completion = await client.chat.completions.create({
      model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
      max_completion_tokens: 5000,
      temperature: 1,
      top_p: 1,
      messages: messages,
    });

    // console.log("Kluster AI Response:", JSON.stringify(completion, null, 2));

    // Parse the completion if it's a string
    const parsedCompletion =
      typeof completion === "string" ? JSON.parse(completion) : completion;

    // Now access the content from the parsed object
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

    // If a query is provided, perform YouTube search
    if (query) {
      console.log("Performing YouTube search for query:", query);
      try {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/search",
          {
            params: {
              part: "snippet",
              q: query,
              maxResults: 5, // Limit to 5 results
              type: "video",
              key: YOUTUBE_API_KEY,
            },
          }
        );

        console.log("YouTube Response:", response.data);

        // Extract video details
        const videos = response.data.items.map((item) => ({
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

        // Return both AI text and video list
        return res.json({ aiText: aiResponse, videos });
      } catch (youtubeError) {
        console.error("Error during YouTube API call:", youtubeError);
        return res.status(500).json({
          message: "Error fetching YouTube videos",
          error: youtubeError.message,
        });
      }
    }

    // Return only the AI text if no query is provided
    res.json({ aiText: aiResponse });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

module.exports = router;
