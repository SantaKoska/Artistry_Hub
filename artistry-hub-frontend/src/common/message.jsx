import React, { useEffect, useState } from "react";
import axios from "axios";
import { BiSearch } from "react-icons/bi";
import { AiOutlineMessage, AiOutlineSend } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MessagePage = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  //   console.log(requests);

  //   console.log(messages);

  useEffect(() => {
    if (token) {
      fetchUserDetails();
      fetchChatList();
      fetchRequests();
    }
  }, [token]);

  useEffect(() => {
    // Polling interval for fetching new messages every 5 seconds
    let pollingInterval;
    if (currentChat) {
      pollingInterval = setInterval(() => {
        fetchMessageHistory(currentChat.id);
      }, 2000);
    }

    return () => {
      // Clear interval when the component unmounts or chat changes
      clearInterval(pollingInterval);
    };
  }, [currentChat]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/message/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchChatList = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/message/chat-list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/message/pending-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching message requests:", error);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await axios.post(
        "http://localhost:8000/message/accept-request",
        { requesterId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.sender !== requesterId)
      );
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const fetchMessageHistory = async (chatId) => {
    if (!chatId) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/message/message-history/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching message history:", error);
    }
  };

  const handleChatClick = (chat) => {
    setCurrentChat(chat);
    fetchMessageHistory(chat.id);
  };

  const handleSearchUserClick = (user) => {
    setCurrentChat(user);
    fetchMessageHistory(user._id);
    setSearchTerm("");
    setSearchResults([]);
  };

  const sendMessage = async () => {
    if (!messageInput || !currentChat) return;

    const messageData = {
      recipientId: currentChat.id,
      content: messageInput,
    };

    try {
      await axios.post(
        "http://localhost:8000/message/send-message",
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the local messages state with the new message
      setMessages((prevMessages) => [
        ...prevMessages,
        { content: messageInput, sender: user._id },
      ]);
      setMessageInput(""); // Clear the input
    } catch (error) {
      toast.error(
        `Error sending message: ${
          error.response?.data?.message || "An error occurred"
        }`,
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      console.log(messageId);
      await axios.delete(
        `http://localhost:8000/message/delete-message/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentChat) return;

    try {
      await axios.delete(
        `http://localhost:8000/message/clear-chat/${currentChat._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages([]); // Clear local messages state
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const fetchSearchResults = async (searchTerm) => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:8000/message/search?query=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-800 rounded-md shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 p-6 pb-28 mb-48 text-black">
      {/* Chat List Section */}
      <div className="w-full md:w-1/3 bg-white rounded-md p-4 shadow-md relative">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-2 mb-4 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            fetchSearchResults(e.target.value);
          }}
        />
        <BiSearch className="absolute left-3 top-3 text-gray-400" />

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="absolute bg-white border mt-2 max-h-40 overflow-y-auto w-full z-10 rounded-md shadow-lg">
            {searchResults.map((result) => (
              <div
                key={result._id}
                className="flex p-2 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                onClick={() => handleSearchUserClick(result)}
              >
                <img
                  src={`http://localhost:8000${result.profilePicture}`}
                  className="w-10 h-10 rounded-full"
                  alt={result.userName}
                />
                <p className="ml-2 text-black font-semibold">
                  {result.userName}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Chat list */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-black">Chats</h3>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center p-2 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
              onClick={() => handleChatClick(chat)}
            >
              <img
                src={`http://localhost:8000${chat.profilePicture}`}
                alt={chat.userName}
                className="w-10 h-10 rounded-full"
              />
              <p className="ml-2 text-black font-semibold">{chat.userName}</p>
              <AiOutlineMessage className="ml-auto text-gray-400" />
            </div>
          ))}
        </div>

        {/* Message Requests Section */}
        <h2 className="font-semibold mt-4 text-black">Message Requests</h2>
        {requests.map((request) => (
          <div
            key={request.sender}
            className="flex justify-between items-center bg-gray-100 p-2 rounded mt-2"
          >
            <img
              src={`http://localhost:8000${request.sender.profilePicture}`}
              className="w-10 h-10 rounded-full" // Ensure it's styled as a circle
            />
            <p className="font-semibold">{request.sender.userName}</p>
            <button
              onClick={() => handleAcceptRequest(request.sender)}
              className="bg-blue-500 text-white px-2 py-1 rounded"
            >
              Accept
            </button>
          </div>
        ))}
      </div>

      {/* Message Section */}
      <div className="w-full md:w-2/3 bg-white rounded-md p-4 shadow-md ml-4">
        {currentChat ? (
          <>
            <div className="flex items-center p-2 border-b border-gray-300 mb-4">
              <img
                src={`http://localhost:8000${currentChat.profilePicture}`}
                alt={currentChat.userName}
                className="w-10 h-10 rounded-full"
              />
              <p className="ml-2 font-semibold text-black">
                {currentChat.userName}
              </p>
            </div>

            {/* Message history */}
            <div className="h-96 overflow-y-auto mb-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`p-2 my-2 rounded-md ${
                    message.sender === user._id
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <p>{message.content}</p>
                  {message.sender === user._id && (
                    <button
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={() => deleteMessage(message._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                <AiOutlineSend />
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-black">
            Select a chat to start messaging
          </p>
        )}
      </div>
    </div>
  );
};

export default MessagePage;
