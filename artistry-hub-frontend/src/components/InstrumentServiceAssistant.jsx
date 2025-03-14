import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BiBot,
  BiUser,
  BiSend,
  BiChevronUp,
  BiChevronDown,
  BiPlay,
  BiTrash,
} from "react-icons/bi";
import { FaSpinner } from "react-icons/fa";
import VideoCarousel from "./VideoCarousel";

const InstrumentServiceAssistant = ({ artForm }) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);

  const purposes = [
    "Cleaning",
    "Repair",
    "Maintenance",
    "Tuning",
    "Restoration",
  ];

  const serviceTemplates = [
    {
      title: "Regular Maintenance",
      description:
        "I need a routine check-up and maintenance for my instrument.",
      purpose: "Maintenance",
    },
    {
      title: "Emergency Repair",
      description: "My instrument has damage that needs immediate attention.",
      purpose: "Repair",
    },
    {
      title: "Deep Cleaning",
      description: "I need a thorough professional cleaning service.",
      purpose: "Cleaning",
    },
  ];

  useEffect(() => {
    fetchChatHistory();
    if (artForm) {
      fetchSpecializations();
    }
  }, [artForm]);

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

  const fetchSpecializations = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/common-things/specializations/${artForm}`
      );
      setSpecializationOptions(response.data);
    } catch (error) {
      console.error("Error fetching specializations:", error);
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpecialization || !selectedPurpose || !description) return;

    const formQuery = `I need ${selectedPurpose.toLowerCase()} for my ${selectedSpecialization}. ${description}`;

    const userMessage = { role: "user", content: formQuery };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/instrumentservice/instrument-service`,
        {
          messages: [{ role: "user", content: formQuery }],
          query: formQuery,
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

      // Reset form
      setSelectedSpecialization("");
      setSelectedPurpose("");
      setDescription("");
    } catch (error) {
      console.error("Error:", error);
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

  const handleDeleteChat = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/instrumentservice/chat-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages([]);
    } catch (error) {
      console.error("Error deleting chat history:", error);
    }
  };

  useEffect(() => {
    if (isChatVisible && chatEndRef.current) {
      const scrollContainer = chatEndRef.current.parentElement;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isChatVisible]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedPurpose(template.purpose);
    setDescription(template.description);
    setShowTemplates(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gradient-to-b from-gray-900 to-[#1a1a1a] text-gray-100">
      {/* Chat Section Controls - Always Visible */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/30 p-3 shadow-lg">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <button
            onClick={() => setIsChatVisible(!isChatVisible)}
            className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-800/50"
          >
            {isChatVisible ? (
              <>
                <BiChevronUp className="text-xl" />
                <span className="font-medium">Hide Chat History</span>
              </>
            ) : (
              <>
                <BiChevronDown className="text-xl" />
                <span className="font-medium">
                  Show Chat History ({messages.length})
                </span>
              </>
            )}
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleDeleteChat}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-300"
            >
              <BiTrash className="text-lg" />
              <span className="font-medium">Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Section - Collapsible with improved scrolling */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          isChatVisible ? "flex-1 min-h-0" : "h-0"
        }`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-gray-800/50">
          <div className="p-4 space-y-6 max-w-4xl mx-auto">
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
        </div>
      </div>

      {/* Form Controls - Sticky Bottom */}
      <div className="sticky bottom-0 z-30 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/30 p-3 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="w-full flex items-center justify-center gap-2 text-yellow-500 hover:text-yellow-400 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gray-800/50"
          >
            {isFormVisible ? (
              <>
                <BiChevronUp className="text-xl" />
                <span className="font-medium">Hide Service Form</span>
              </>
            ) : (
              <>
                <BiChevronDown className="text-xl" />
                <span className="font-medium">Show Service Form</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Section - Collapsible */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden bg-gray-800/90 backdrop-blur-md ${
          isFormVisible ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <form
          onSubmit={handleFormSubmit}
          className="p-4 border-t border-gray-700/30"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Add Quick Templates Section */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-yellow-500 hover:text-yellow-400 text-sm mb-2 flex items-center gap-2"
              >
                <BiPlay
                  className={`transform transition-transform ${
                    showTemplates ? "rotate-90" : ""
                  }`}
                />
                Quick Templates
              </button>

              {showTemplates && (
                <div className="absolute z-10 w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-2 space-y-2">
                  {serviceTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded transition-colors duration-200"
                    >
                      <div className="font-medium text-yellow-500">
                        {template.title}
                      </div>
                      <div className="text-sm text-gray-300">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Instrument Type
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full bg-gray-900/90 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-gray-700/50"
                  required
                >
                  <option value="">Select Instrument</option>
                  {specializationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Service Purpose
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="w-full bg-gray-900/90 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-gray-700/50"
                  required
                >
                  <option value="">Select Purpose</option>
                  {purposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service need..."
                className="w-full bg-gray-900/90 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-gray-700/50 resize-none"
                rows="2"
                required
              />
            </div>
            {/* Add character count and helper text */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>{description.length}/500 characters</span>
              <span>Tip: Be specific about your service needs</span>
            </div>
            <button
              type="submit"
              disabled={
                isLoading ||
                !selectedSpecialization ||
                !selectedPurpose ||
                !description
              }
              className={`w-full p-3 rounded-xl ${
                isLoading ||
                !selectedSpecialization ||
                !selectedPurpose ||
                !description
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600"
              } text-black font-medium transition-all duration-300`}
            >
              {isLoading ? (
                <FaSpinner className="animate-spin mx-auto" />
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstrumentServiceAssistant;
