import React, { useEffect, useState } from "react";
import axios from "axios";
import { BiSearch } from "react-icons/bi";
import {
  AiOutlineMessage,
  AiOutlineSend,
  AiOutlineDelete,
} from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import moment from "moment";

const MessagePage = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchUserDetails();
      fetchChatList();
      fetchRequests();
    }
  }, [token]);

  useEffect(() => {
    let pollingInterval;
    if (currentChat) {
      pollingInterval = setInterval(() => {
        fetchMessageHistory(currentChat.id);
      }, 2000);
    }
    return () => {
      clearInterval(pollingInterval);
    };
  }, [currentChat]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/message/profile`,
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
        `${import.meta.env.VITE_BACKEND_URL}/message/chat-list`,
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
        `${import.meta.env.VITE_BACKEND_URL}/message/pending-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Filter out duplicate requests from the same user
      const uniqueRequests = response.data.reduce((acc, request) => {
        if (!acc.some((req) => req.sender._id === request.sender._id)) {
          acc.push(request);
        }
        return acc;
      }, []);

      setRequests(uniqueRequests);
    } catch (error) {
      console.error("Error fetching message requests:", error);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/message/accept-request`,
        { requesterId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.sender._id !== requesterId)
      );
      fetchChatList();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const fetchMessageHistory = async (chatId) => {
    if (!chatId) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/message/message-history/${chatId}`,
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
        `${import.meta.env.VITE_BACKEND_URL}/message/send-message`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessageInput("");

      setMessages((prevMessages) => [
        ...prevMessages,
        { content: messageInput, sender: user._id, createdAt: new Date() },
      ]);
    } catch (error) {
      setMessageInput("");
      toast.error(`Error sending message: ${error.response?.data?.message}`, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/message/delete-message/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
      setIsModalOpen(false); // Close the modal after deletion
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentChat) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/message/clear-chat/${
          currentChat._id
        }`,
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
        `${
          import.meta.env.VITE_BACKEND_URL
        }/message/search?query=${searchTerm}`,
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
    <div className="flex h-full bg-slate-800 rounded-md shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 p-6 pb-10 mb-8 text-black">
      <div className="w-full md:w-1/3 bg-white rounded-md p-4 shadow-md mr-10 relative">
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
        <BiSearch className="absolute left-9 top-7 text-gray-400" />

        {searchResults.length > 0 && (
          <div className="absolute bg-white border mt-2 max-h-40 overflow-y-auto w-full z-10 rounded-md shadow-lg">
            {searchResults.map((result) => (
              <div
                key={result._id}
                className="flex p-2 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                onClick={() => handleSearchUserClick(result)}
              >
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    result.profilePicture
                  }`}
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

        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-black">Chats</h3>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center p-2 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
              onClick={() => handleChatClick(chat)}
            >
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  chat.profilePicture
                }`}
                alt={chat.userName}
                className="w-10 h-10 rounded-full"
              />
              <p className="ml-2 text-black font-semibold">{chat.userName}</p>
              <AiOutlineMessage className="ml-auto text-gray-400" />
            </div>
          ))}
        </div>

        <h2 className="font-semibold mt-4 text-black">Message Requests</h2>
        {requests.map((request) => (
          <div
            key={request.sender._id}
            className="flex items-center p-2 bg-gray-200 mb-2 rounded-md"
          >
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${
                request.sender.profilePicture
              }`}
              alt={request.sender.userName}
              className="w-10 h-10 rounded-full"
            />
            <p className="ml-2 text-black">{request.sender.userName}</p>
            <button
              className="ml-auto px-3 py-1 bg-blue-500 text-white rounded-md"
              onClick={() => handleAcceptRequest(request.sender._id)}
            >
              Accept
            </button>
          </div>
        ))}
      </div>

      <div className="w-full md:w-2/3 bg-white rounded-md p-4 shadow-md relative">
        {currentChat ? (
          <>
            <div className="flex items-center p-2 bg-slate-500 rounded-lg">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  currentChat.profilePicture
                }`}
                alt={currentChat.userName}
                className="w-12 h-12 rounded-full"
              />
              <Link to={`/profile/${currentChat.userName}`}>
                <p className="font-bold text-lg text-white hover:underline pl-4">
                  {currentChat.userName}
                </p>
              </Link>
            </div>

            <div className="mt-4 h-[400px] overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex flex-col ${
                      message.sender === user._id ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-3 pr-10 rounded-lg mb-2 max-w-[80%] relative ${
                        message.sender === user._id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      <p>{message.content}</p>
                      {/* Delete Button for User's Messages */}
                      {message.sender === user._id && (
                        <button
                          className="absolute top-0 right-0 mt-1 mr-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all"
                          onClick={() => {
                            setIsModalOpen(true);
                            setMessageToDelete(message._id);
                          }}
                        >
                          <AiOutlineDelete className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {/* Timestamp */}
                    <p className="text-gray-400 text-xs mt-1">
                      {moment(message.createdAt).format("MMM DD, YYYY, h:mm A")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No messages yet.</p>
              )}
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <h2 className="text-lg font-semibold mb-4">
                    Confirm Deletion
                  </h2>
                  <p className="mb-4">
                    Are you sure you want to delete this message?
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      onClick={async () => {
                        await handleDeleteMessage(messageToDelete);
                        setIsModalOpen(false);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 w-full p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  className="p-2 bg-blue-500 text-white rounded-md"
                  onClick={sendMessage}
                >
                  <AiOutlineSend />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center mt-16">
            Select a chat to start messaging
          </p>
        )}
      </div>
    </div>
  );
};

export default MessagePage;
