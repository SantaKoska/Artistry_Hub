import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BiBot,
  BiUser,
  BiSend,
  BiChevronUp,
  BiChevronDown,
  BiPlay,
} from "react-icons/bi";
import { FaSpinner } from "react-icons/fa";
import VideoCarousel from "./VideoCarousel";

const InstrumentServiceAssistant = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/instrumentservice/chat-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Convert chat history to messages format with videos and reverse the order
      const historyMessages = response.data.conversations
        .slice() // Create a copy of the array
        .reverse() // Reverse the order of conversations
        .flatMap((conv) => [
          { role: "user", content: conv.query },
          {
            role: "assistant",
            content: conv.response,
            videos: conv.suggestedVideos || [],
          },
        ]);

      setMessages(historyMessages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const toggleMessageVideos = (index) => {
    setCollapsedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setQuery("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/instrumentservice/instrument-service`,
        {
          messages: [{ role: "user", content: query }],
          query,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const aiMessage = { role: "assistant", content: res.data.aiText };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      if (res.data.videos) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: res.data.aiText,
            videos: res.data.videos,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-[#1a1a1a] text-gray-100">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3 animate-fadeIn">
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } items-start space-x-3`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                  <BiBot className="text-black text-lg" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xl ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black ml-auto"
                    : "bg-gray-800/90 backdrop-blur-md border border-gray-700/50"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                  <BiUser className="text-white text-lg" />
                </div>
              )}
            </div>

            {/* Video suggestions under assistant messages */}
            {message.role === "assistant" &&
              message.videos &&
              message.videos.length > 0 && (
                <div className="ml-11 pl-4 border-l-2 border-yellow-500/20">
                  <button
                    onClick={() => toggleMessageVideos(index)}
                    className="flex items-center space-x-2 text-yellow-500 hover:text-yellow-400 text-sm mb-3 transition-all duration-300 hover:translate-x-1"
                  >
                    {collapsedMessages.has(index) ? (
                      <BiChevronDown className="text-xl" />
                    ) : (
                      <BiChevronUp className="text-xl" />
                    )}
                    <span className="font-medium">
                      Suggested Videos ({message.videos.length})
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      collapsedMessages.has(index)
                        ? "max-h-[400px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <VideoCarousel videos={message.videos} />
                  </div>
                </div>
              )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <BiBot className="text-black text-lg" />
            </div>
            <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-gray-700/50">
              <FaSpinner className="animate-spin text-yellow-500 text-lg" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-700/30 p-4 bg-gray-800/90 backdrop-blur-md"
      >
        <div className="relative flex items-center max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about instrument service..."
            className="w-full bg-gray-900/90 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none overflow-hidden text-sm shadow-xl border border-gray-700/50 placeholder-gray-400"
            rows="1"
            style={{ minHeight: "2.75rem" }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`absolute right-3 p-2 rounded-lg ${
              isLoading || !query.trim()
                ? "text-gray-500"
                : "text-yellow-500 hover:text-yellow-400 hover:scale-110"
            } transition-all duration-300`}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin text-lg" />
            ) : (
              <BiSend className="text-xl" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstrumentServiceAssistant;
