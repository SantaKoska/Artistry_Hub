import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const InstrumentServiceAssistant = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [videos, setVideos] = useState([]);
  const chatEndRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userMessage = { role: "user", content: query };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/instrumentservice/instrument-service`,
        {
          messages: [{ role: "user", content: query }],
          query,
        }
      );

      const aiMessage = { role: "assistant", content: res.data.aiText };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      setVideos(res.data.videos);
    } catch (error) {
      console.error("Error fetching assistant response:", error);
    }

    setQuery("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg max-h-96 overflow-y-auto">
      <h2 className="text-xl font-semibold text-yellow-500 mb-4 text-center">
        Instrument Service Assistant
      </h2>
      <div className="flex flex-col space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-xs text-white ${
                message.role === "user" ? "bg-blue-500" : "bg-gray-700"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about instrument service..."
          className="border border-yellow-500 p-2 w-full text-black rounded-l-md"
          required
        />
        <button
          type="submit"
          className="bg-yellow-500 text-black p-2 rounded-r-md hover:bg-yellow-600 transition-all duration-300"
        >
          Send
        </button>
      </form>
      {videos.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold text-yellow-500">Suggested Videos:</h2>
          <ul>
            {videos.map((video) => (
              <li key={video.url}>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {video.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InstrumentServiceAssistant;
