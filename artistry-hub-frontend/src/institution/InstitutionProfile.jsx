import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

Modal.setAppElement("#root");

const InstitutionProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [logoutModalIsOpen, setLogoutModalIsOpen] = useState(false);
  const [confirmationModalIsOpen, setConfirmationModalIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    registeredUnder: "",
    registrationID: "",
    userName: "",
    district: "",
    state: "",
    country: "",
    postalCode: "",
    profilePicture: null,
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPosts, setShowPosts] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    uniqueEngagers: 0,
    mostEngagedPost: null,
    recentEngagement: 0,
    interactionTrend: "stable",
    engagementMetrics: {
      averageLikesPerPost: 0,
      averageCommentsPerPost: 0,
      followerEngagementRate: 0,
    },
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/institution/institution-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(data);
        setFormData({
          description: data.description,
          registeredUnder: data.registeredUnder,
          registrationID: data.registrationID,
          userName: data.userName,
          district: data.location.district || "",
          state: data.location.state || "",
          country: data.location.country || "",
          postalCode: data.location.postalCode || "",
        });
        setPosts(data.postsinfo || []);
      } catch (error) {
        toast.error(`Error fetching profile: ${error.response?.data?.err}`);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/institution/post-analytics`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAnalytics(response.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchProfile();
    fetchAnalytics();
  }, [token]);

  const handleOpenModal = () => setModalIsOpen(true);
  const handleCloseModal = () => setModalIsOpen(false);
  const handleOpenLogoutModal = () => setLogoutModalIsOpen(true);
  const handleCloseLogoutModal = () => setLogoutModalIsOpen(false);
  const handleOpenConfirmationModal = (postId) => {
    setPostToDelete(postId);
    setConfirmationModalIsOpen(true);
  };
  const handleCloseConfirmationModal = () => setConfirmationModalIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData((prevState) => ({ ...prevState, profilePicture: file }));
    } else {
      toast.error("Please upload a valid image file");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    try {
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/institution/institution-editprofile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Profile updated successfully");
      handleCloseModal();
      fetchProfile();
    } catch (error) {
      toast.error(`Error updating profile: ${error.response?.data?.err}`);
    }
  };

  const handleDeletePost = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/posts/delete-post/${postToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Post deleted successfully");
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postToDelete)
      );
      handleCloseConfirmationModal();
    } catch (error) {
      toast.error(`Error deleting post: ${error.response?.data?.error}`);
      handleCloseConfirmationModal();
    }
  };

  const Post = ({ post }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentLimit = 100; // Define character limit for truncation

    const toggleReadMore = () => {
      setIsExpanded((prev) => !prev);
    };

    return (
      <div
        key={post._id}
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
      >
        {post.mediaUrl && post.mediaType === "image" && (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            alt="Post"
            className="w-full h-48 object-cover"
          />
        )}
        {post.mediaUrl && post.mediaType === "video" && (
          <video
            controls
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            className="w-full h-48 object-cover"
          />
        )}
        {post.mediaUrl && post.mediaType === "audio" && (
          <audio
            controls
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            className="w-full object-cover"
          />
        )}

        <div className="p-4">
          <p className="text-gray-300">
            {isExpanded
              ? post.content
              : truncateText(post.content, contentLimit)}
            {post.content.length > contentLimit && (
              <button
                onClick={toggleReadMore}
                className="text-yellow-400 hover:text-yellow-500 ml-2 font-medium"
              >
                {isExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </p>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleOpenConfirmationModal(post._id)}
              className="text-red-400 hover:text-red-500 transition-colors"
              title="Delete Post"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-8">
      {profile && (
        <div className="max-w-7xl mx-auto">
          {/* Profile Header Section */}
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column - Profile Picture & Quick Actions */}
              <div className="flex flex-col items-center md:w-1/3">
                <div className="relative group">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${
                      profile.profilePicture
                    }`}
                    alt="Institution Logo"
                    className="w-48 h-48 rounded-full object-cover border-4 border-yellow-400 transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={handleOpenModal}
                    className="absolute bottom-2 right-2 bg-yellow-400 p-2 rounded-full hover:bg-yellow-500 transition-colors"
                    title="Edit Profile"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>

                <h1 className="text-3xl font-bold text-yellow-400 mt-4">
                  {profile.userName}
                </h1>

                {/* Stats Cards */}
                <div className="flex gap-6 mt-6">
                  <div className="text-center bg-gray-700 rounded-lg p-4 w-32">
                    <p className="text-2xl font-bold text-yellow-400">
                      {profile.followerCount}
                    </p>
                    <p className="text-gray-300">Followers</p>
                  </div>
                  <div className="text-center bg-gray-700 rounded-lg p-4 w-32">
                    <p className="text-2xl font-bold text-yellow-400">
                      {profile.numberOfPosts}
                    </p>
                    <p className="text-gray-300">Posts</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full mt-6">
                  <button
                    onClick={handleOpenLogoutModal}
                    className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Right Column - Profile Info */}
              <div className="md:w-2/3 space-y-6">
                <div className="bg-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-yellow-400 mb-4">
                    About Us
                  </h2>
                  <p className="text-gray-200 leading-relaxed">
                    {profile.description || "No description available"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Registered Under
                    </h3>
                    <p className="text-gray-200">{profile.registeredUnder}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Registration ID
                    </h3>
                    <p className="text-gray-200">{profile.registrationID}</p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                    Location
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-200">
                      <span className="text-yellow-400">District:</span>{" "}
                      {profile.location?.district}
                    </p>
                    <p className="text-gray-200">
                      <span className="text-yellow-400">State:</span>{" "}
                      {profile.location?.state}
                    </p>
                    <p className="text-gray-200">
                      <span className="text-yellow-400">Country:</span>{" "}
                      {profile.location?.country}
                    </p>
                    <p className="text-gray-200">
                      <span className="text-yellow-400">Postal Code:</span>{" "}
                      {profile.location?.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts and Analytics Section */}
          <div className="mt-8">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setShowPosts(true);
                  setShowAnalytics(false);
                }}
                className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                  showPosts
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                }`}
              >
                Our Posts
              </button>
              <button
                onClick={() => {
                  setShowAnalytics(true);
                  setShowPosts(false);
                }}
                className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                  showAnalytics
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                }`}
              >
                Engagement Analytics
              </button>
            </div>

            {/* Posts Content */}
            {showPosts && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => <Post key={post._id} post={post} />)
                ) : (
                  <p className="text-gray-400 col-span-full text-center">
                    No posts available.
                  </p>
                )}
              </div>
            )}

            {/* Analytics Content */}
            {showAnalytics && (
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm">Total Posts</p>
                        <p className="text-yellow-400 font-semibold text-lg mt-1">
                          {analytics.totalPosts}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm">Total Likes</p>
                        <p className="text-yellow-400 font-semibold text-lg mt-1">
                          {analytics.totalLikes}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm">Total Comments</p>
                        <p className="text-yellow-400 font-semibold text-lg mt-1">
                          {analytics.totalComments}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-sm">Unique Engagers</p>
                        <p className="text-yellow-400 font-semibold text-lg mt-1">
                          {analytics.uniqueEngagers}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most Engaged Post */}
                {analytics.mostEngagedPost && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-400 text-sm">Most Engaged Post</p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>

                    {/* Media Content */}
                    {analytics.mostEngagedPost.mediaUrl && (
                      <div className="mb-4 flex justify-center">
                        {analytics.mostEngagedPost.mediaType === "image" && (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              analytics.mostEngagedPost.mediaUrl
                            }`}
                            alt="Most engaged post"
                            className="max-h-48 rounded-lg object-contain"
                          />
                        )}
                        {analytics.mostEngagedPost.mediaType === "video" && (
                          <video
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              analytics.mostEngagedPost.mediaUrl
                            }`}
                            className="max-h-48 rounded-lg"
                            controls
                          />
                        )}
                        {analytics.mostEngagedPost.mediaType === "audio" && (
                          <audio
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              analytics.mostEngagedPost.mediaUrl
                            }`}
                            className="w-full"
                            controls
                          />
                        )}
                      </div>
                    )}

                    <p className="text-gray-300 text-sm line-clamp-2">
                      {analytics.mostEngagedPost.content}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <p className="text-yellow-400 text-sm flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        {analytics.mostEngagedPost.likes}
                      </p>
                      <p className="text-yellow-400 text-sm flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        {analytics.mostEngagedPost.comments}
                      </p>
                    </div>
                  </div>
                )}

                {/* Engagement Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      Average Likes per Post
                    </p>
                    <p className="text-yellow-400 font-semibold text-lg mt-1">
                      {analytics.engagementMetrics.averageLikesPerPost.toFixed(
                        1
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      Average Comments per Post
                    </p>
                    <p className="text-yellow-400 font-semibold text-lg mt-1">
                      {analytics.engagementMetrics.averageCommentsPerPost.toFixed(
                        1
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">
                      Follower Engagement Rate
                    </p>
                    <p className="text-yellow-400 font-semibold text-lg mt-1">
                      {analytics.engagementMetrics.followerEngagementRate.toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Modal
            isOpen={confirmationModalIsOpen}
            onRequestClose={handleCloseConfirmationModal}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">Confirm Deletion</h2>
            <p className="text-white">
              Are you sure you want to delete this post?
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseConfirmationModal}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="bg-red-500 text-white rounded px-4 py-2"
              >
                Delete
              </button>
            </div>
          </Modal>

          <Modal
            isOpen={logoutModalIsOpen}
            onRequestClose={handleCloseLogoutModal}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">Confirm Logout</h2>
            <p className="text-white">Are you sure you want to logout?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseLogoutModal}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white rounded px-4 py-2"
              >
                Logout
              </button>
            </div>
          </Modal>

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={handleCloseModal}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-2/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="userName" className="text-white">
                  Username
                </label>
                <input
                  id="userName"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="description" className="text-white">
                  Description
                </label>
                <textarea
                  id="description"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="registeredUnder" className="text-white">
                  Registered Under
                </label>
                <input
                  id="registeredUnder"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.registeredUnder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registeredUnder: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="registrationID" className="text-white">
                  Registration ID
                </label>
                <input
                  id="registrationID"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.registrationID}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationID: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="district" className="text-white">
                  District
                </label>
                <input
                  id="district"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="state" className="text-white">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="country" className="text-white">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="postalCode" className="text-white">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-500 text-white rounded px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-900 text-white rounded px-4 py-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default InstitutionProfile;
