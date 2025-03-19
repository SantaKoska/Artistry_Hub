import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useNavigate, Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import * as faceapi from "face-api.js";

Modal.setAppElement("#root");

const ArtistProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [confirmationModalIsOpen, setConfirmationModalIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [logoutModalIsOpen, setLogoutModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    artForm: "",
    specialisation: "",
    userName: "",
    profilePicture: null,
  });
  const [isFaceSetupModalOpen, setIsFaceSetupModalOpen] = useState(false);
  const [faceAuthModalIsOpen, setFaceAuthModalIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const videoRef = useRef();
  const canvasRef = useRef();
  const [followersModalIsOpen, setFollowersModalIsOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPosts, setShowPosts] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/artist-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(data);
        setFormData({
          description: data.description,
          artForm: data.artForm,
          specialisation: data.specialisation,
          userName: data.userName,
        });
        setPosts(data.postsinfo || []);
      } catch (error) {
        toast.error(`Error fetching profile: ${error.response?.data?.err}`);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/post-analytics`,
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Face detection models loaded successfully");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        toast.error("Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  const handleOpenModal = () => setModalIsOpen(true);
  const handleCloseModal = () => setModalIsOpen(false);
  const handleOpenLogoutModal = () => setLogoutModalIsOpen(true);
  const handleCloseLogoutModal = () => setLogoutModalIsOpen(false);
  const handleOpenConfirmationModal = (postId) => {
    setPostToDelete(postId);
    setConfirmationModalIsOpen(true);
  };
  const handleCloseConfirmationModal = () => setConfirmationModalIsOpen(false);

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
        `${import.meta.env.VITE_BACKEND_URL}/artist/artist-editprofile`,
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
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

  const startFaceSetup = async () => {
    if (profile.faceData) {
      toast.info("Face data already exists. No need to capture again.");
      return;
    }

    setIsFaceSetupModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error("Unable to access camera");
      console.error(error);
    }
  };

  const captureFaceData = async () => {
    if (!videoRef.current) return;

    try {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        toast.error(
          "No face detected. Please ensure your face is clearly visible."
        );
        return;
      }

      // Convert face descriptor to Array for sending to server
      const faceDescriptor = Array.from(detections.descriptor);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/setup-face-auth`,
        { faceDescriptor },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        toast.success("Face authentication setup successful");
        setIsFaceSetupModalOpen(false);
        // Stop the video stream
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    } catch (error) {
      toast.error("Error setting up face authentication");
      console.error(error);
    }
  };

  const handleFaceAuthToggle = async () => {
    if (profile.isFaceAuthEnabled) {
      // Confirm password to disable face authentication
      if (!password) {
        toast.error("Password is required");
        return;
      }

      try {
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/auth/disable-face-auth`,
          { password },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          toast.success("Face authentication disabled successfully");
          setProfile((prev) => ({ ...prev, isFaceAuthEnabled: false }));
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.err) {
          toast.error(error.response.data.err);
        } else {
          toast.error("An error occurred while disabling face authentication");
        }
      }
    } else {
      // Check if the user already has face data
      if (profile.faceData) {
        // Directly enable face authentication if face data exists
        try {
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/auth/setup-face-auth`,
            { faceDescriptor: [] }, // Pass an empty array or the existing face data
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success("Face authentication enabled successfully");
          setProfile((prev) => ({ ...prev, isFaceAuthEnabled: true }));
        } catch (error) {
          toast.error("Error enabling face authentication");
        }
      } else {
        // Open camera to capture face data
        startFaceSetup();
      }
    }
    setFaceAuthModalIsOpen(false);
    setPassword("");
  };

  const fetchFollowers = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/common-things/followers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFollowers(data);
    } catch (error) {
      toast.error(`Error fetching followers: ${error.response?.data?.err}`);
    }
  };

  const handleOpenFollowersModal = async () => {
    await fetchFollowers();
    setFollowersModalIsOpen(true);
  };

  const handleCloseFollowersModal = () => {
    setFollowersModalIsOpen(false);
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
                    alt="Profile"
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
                  <div
                    className="text-center bg-gray-700 rounded-lg p-4 w-32 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={handleOpenFollowersModal}
                  >
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
                  <button
                    onClick={() => setFaceAuthModalIsOpen(true)}
                    className="w-full py-2 px-4 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                  >
                    {profile.isFaceAuthEnabled
                      ? "Disable Face Authentication"
                      : "Enable Face Authentication"}
                  </button>
                </div>
              </div>

              {/* Right Column - Profile Info */}
              <div className="md:w-2/3 space-y-6">
                <div className="bg-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-yellow-400 mb-4">
                    About Me
                  </h2>
                  <p className="text-gray-200 leading-relaxed">
                    {profile.description || "No description available"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Art Form
                    </h3>
                    <p className="text-gray-200">{profile.artForm}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Specialization
                    </h3>
                    <p className="text-gray-200">{profile.specialisation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
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
                My Posts
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

                {/* Recent Engagement Trend */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-400">Recent Engagement</p>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        analytics.interactionTrend === "up"
                          ? "bg-green-500"
                          : analytics.interactionTrend === "down"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <p className="text-yellow-400 text-lg font-semibold">
                    {analytics.recentEngagement}%
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    engagement rate in last 7 days
                  </p>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-3">
                    Engagement Metrics
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-sm">
                        Avg. Likes per Post
                      </span>
                      <span className="text-yellow-400 text-lg font-semibold">
                        {analytics.engagementMetrics?.averageLikesPerPost.toFixed(
                          1
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-sm">
                        Avg. Comments per Post
                      </span>
                      <span className="text-yellow-400 text-lg font-semibold">
                        {analytics.engagementMetrics?.averageCommentsPerPost.toFixed(
                          1
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-300 text-sm">
                        Follower Engagement
                      </span>
                      <span className="text-yellow-400 text-lg font-semibold">
                        {analytics.engagementMetrics?.followerEngagementRate.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
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
                <label htmlFor="artForm" className="text-white">
                  Art Form
                </label>
                <input
                  id="artForm"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.artForm}
                  onChange={(e) =>
                    setFormData({ ...formData, artForm: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="specialisation" className="text-white">
                  Specialization
                </label>
                <input
                  id="specialisation"
                  type="text"
                  className="bg-gray-700 rounded p-2 text-white"
                  value={formData.specialisation}
                  onChange={(e) =>
                    setFormData({ ...formData, specialisation: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="profilePicture" className="text-white">
                  Profile Picture
                </label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="bg-gray-700 rounded p-2 text-white"
                  onChange={handleFileChange}
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

          <Modal
            isOpen={isFaceSetupModalOpen}
            onRequestClose={() => setIsFaceSetupModalOpen(false)}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-2/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">
              Face Authentication Setup
            </h2>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                className="w-full rounded-lg"
                style={{ maxWidth: "640px" }}
              />
              <canvas ref={canvasRef} className="absolute top-0 left-0" />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  const stream = videoRef.current.srcObject;
                  if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                  }
                  setIsFaceSetupModalOpen(false);
                }}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={captureFaceData}
                className="bg-yellow-500 text-black rounded px-4 py-2"
              >
                Capture Face Data
              </button>
            </div>
          </Modal>

          <Modal
            isOpen={faceAuthModalIsOpen}
            onRequestClose={() => {
              setFaceAuthModalIsOpen(false);
              setPassword("");
            }}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">
              {profile.isFaceAuthEnabled
                ? "Disable Face Authentication"
                : "Enable Face Authentication"}
            </h2>
            {profile.isFaceAuthEnabled ? (
              <>
                <p className="text-white">
                  Please confirm your password to disable face authentication.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 rounded p-2 text-white"
                  placeholder="Enter your password"
                />
              </>
            ) : (
              <p className="text-white">
                You will be prompted to capture your face data.
              </p>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  setFaceAuthModalIsOpen(false);
                  setPassword("");
                }}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleFaceAuthToggle}
                className="bg-yellow-500 text-black rounded px-4 py-2"
              >
                {profile.isFaceAuthEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </Modal>

          <Modal
            isOpen={followersModalIsOpen}
            onRequestClose={handleCloseFollowersModal}
            className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-white text-2xl mb-4">Followers</h2>
            <div className="max-h-96 overflow-y-auto">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center gap-4 p-4 border-b border-gray-700"
                  >
                    <Link to={`/profile/${follower.userName}`}>
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${
                          follower.profilePicture
                        }`}
                        alt={follower.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </Link>
                    <div>
                      <Link to={`/profile/${follower.userName}`}>
                        <p className="text-white font-semibold hover:text-yellow-400 transition-colors">
                          {follower.userName}
                        </p>
                      </Link>
                      <p className="text-gray-400 text-sm">
                        {follower.artForm}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No followers yet</p>
              )}
            </div>
            <button
              onClick={handleCloseFollowersModal}
              className="mt-4 w-full bg-gray-700 text-white rounded px-4 py-2 hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default ArtistProfile;
