import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUsers,
  FaPalette,
  FaGraduationCap,
  FaBook,
  FaBuilding,
  FaTools,
  FaNewspaper,
} from "react-icons/fa";
import { format } from "date-fns";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalInstitutions: 0,
    totalServiceProviders: 0,
    totalPosts: 0,
  });

  const [recentActivity, setRecentActivity] = useState({
    users: [],
    posts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Add these new states for user management
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add these missing state variables
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/admin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setStats(response.data.stats);
        setRecentActivity(response.data.recentActivity);
        setError(null);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError(
          "Failed to load dashboard data. Please check your connection and permissions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsers(response.data.users);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(
        "Failed to load user data. Please check your connection and permissions."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const fetchUserPosts = async (userId) => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/admin/users/${userId}/posts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUserPosts(response.data.posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setError("Failed to load user posts. Please try again.");
    } finally {
      setPostsLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      let endpoint = `${
        import.meta.env.VITE_BACKEND_URL
      }/admin/users/${userId}/${action}`;
      let payload = {};

      // If suspending or unverifying, ask for reason
      if (action === "suspend" || action === "unverify") {
        const actionText =
          action === "suspend" ? "suspension" : "unverification";
        const reason = window.prompt(
          `Please provide a reason for ${actionText}:`
        );
        if (reason === null) {
          // User cancelled the prompt
          setActionLoading(false);
          return;
        }
        payload = { reason };
      }

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh user list after action
      fetchUsers();

      // Close modal if open
      if (userModalOpen) {
        setUserModalOpen(false);
        setSelectedUser(null);
      }

      // Show success message
      let actionText = "";
      if (action === "suspend") actionText = "suspended";
      else if (action === "verify") actionText = "verified";
      else if (action === "unverify") actionText = "unverified";

      alert(`User ${actionText} successfully`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setError(`Failed to ${action} user. Please try again.`);
      alert(
        `Error: ${error.response?.data?.message || "An unknown error occurred"}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedUser(response.data.user);
      setUserModalOpen(true);

      // Fetch user's posts when viewing details
      await fetchUserPosts(userId);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Failed to load user details. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase());

    const matchesFilter =
      userFilter === "all" ||
      user.role.toLowerCase().includes(userFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const StatCard = ({ title, value, icon, bgColor }) => (
    <div
      className={`${bgColor} rounded-lg p-4 md:p-6 shadow-lg text-white transition-transform hover:scale-102 h-full`}
    >
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <h3 className="text-lg md:text-xl font-semibold">{title}</h3>
        <div className="text-2xl md:text-3xl opacity-80">{icon}</div>
      </div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
    </div>
  );

  const RecentUserItem = ({ user }) => (
    <div className="bg-gray-800 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={
              user.profilePicture
                ? `${import.meta.env.VITE_BACKEND_URL}${user.profilePicture}`
                : "/dp/default-profile.png"
            }
            alt={user.userName}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <p className="font-semibold">{user.userName}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
        <div>
          <span className="bg-blue-600 text-xs px-2 py-1 rounded">
            {user.role}
          </span>
          <p className="text-gray-400 text-xs mt-1">
            {format(new Date(user.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );

  const RecentPostItem = ({ post }) => (
    <div className="bg-gray-800 rounded-lg p-4 mb-2">
      <div className="flex items-start gap-3">
        <img
          src={
            post.user?.profilePicture
              ? `${import.meta.env.VITE_BACKEND_URL}${post.user.profilePicture}`
              : "/dp/default-profile.png"
          }
          alt={post.user?.userName || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold">
            {post.user?.userName || "Unknown User"}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {post.content?.length > 100
              ? post.content.substring(0, 100) + "..."
              : post.content}
          </p>

          {/* Display media based on type */}
          {post.mediaUrl && post.mediaType === "image" && (
            <div className="mt-2">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                alt="Post image"
                className="h-16 w-auto rounded object-cover"
              />
            </div>
          )}
          {post.mediaUrl && post.mediaType === "video" && (
            <div className="mt-2">
              <video
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                className="h-16 w-auto rounded"
              />
            </div>
          )}
          {post.mediaUrl && post.mediaType === "audio" && (
            <div className="mt-2">
              <audio
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                className="w-full h-6"
              />
            </div>
          )}

          {/* For backward compatibility, also check images array */}
          {!post.mediaUrl && post.images && post.images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {post.images.map((image, idx) => (
                <img
                  key={idx}
                  src={`${import.meta.env.VITE_BACKEND_URL}${image}`}
                  alt={`Post image ${idx + 1}`}
                  className="h-16 w-auto rounded object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{format(new Date(post.timestamp), "MMM d, yyyy")}</span>
            <span>❤️ {post.likes || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // User Modal Component
  const UserDetailModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">User Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <img
                src={
                  user.profilePicture
                    ? `${import.meta.env.VITE_BACKEND_URL}${
                        user.profilePicture
                      }`
                    : "/dp/default-profile.png"
                }
                alt={user.userName}
                className="w-24 h-24 rounded-full object-cover"
              />

              <div>
                <h4 className="text-lg font-semibold">{user.userName}</h4>
                <p className="text-blue-400">{user.email}</p>
                <span className="inline-block bg-blue-600 px-2 py-1 rounded text-sm mt-2">
                  {user.role}
                </span>
                <p className="text-gray-400 text-sm mt-1">
                  Joined: {format(new Date(user.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {user.description && (
              <div className="mb-4">
                <h5 className="font-semibold mb-1">Bio</h5>
                <p className="text-gray-300">{user.description}</p>
              </div>
            )}

            {user.role === "Artist" && user.artistDetails && (
              <div className="mb-4">
                <h5 className="font-semibold mb-1">Artist Details</h5>
                <p>Art Form: {user.artistDetails.artForm}</p>
                <p>
                  Specialization:{" "}
                  {user.artistDetails.specialisation
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/\s+/g, " ")}
                </p>
                <p>
                  Courses Teaching:{" "}
                  {user.artistDetails.teachingCourse?.length || 0}
                </p>
              </div>
            )}

            {user.role === "Institution" && user.institutionDetails && (
              <div className="mb-4">
                <h5 className="font-semibold mb-1">Institution Details</h5>
                <p>
                  Registered Under: {user.institutionDetails.registeredUnder}
                </p>
                <p>Registration ID: {user.institutionDetails.registrationID}</p>
                {user.institutionDetails.location && (
                  <p>
                    Location: {user.institutionDetails.location.address},
                    {user.institutionDetails.location.district},
                    {user.institutionDetails.location.state},
                    {user.institutionDetails.location.country}
                  </p>
                )}
              </div>
            )}

            {user.role === "Service Provider" &&
              user.serviceProviderDetails && (
                <div className="mb-4">
                  <h5 className="font-semibold mb-1">
                    Service Provider Details
                  </h5>
                  <p>Owner: {user.serviceProviderDetails.ownerName}</p>
                  <p>Expertise: {user.serviceProviderDetails.expertise}</p>
                  {user.serviceProviderDetails.location && (
                    <p>
                      Location: {user.serviceProviderDetails.location.address},
                      {user.serviceProviderDetails.location.district},
                      {user.serviceProviderDetails.location.state},
                      {user.serviceProviderDetails.location.country}
                    </p>
                  )}
                </div>
              )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!user.suspended ? (
                <button
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                  onClick={() => handleUserAction(user._id, "suspend")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Suspend Account"}
                </button>
              ) : (
                <button
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded"
                  onClick={() => handleUserAction(user._id, "verify")}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Processing..."
                    : "Unsuspend & Verify Account"}
                </button>
              )}

              {!user.verified && !user.suspended && (
                <button
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded"
                  onClick={() => handleUserAction(user._id, "verify")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Verify Account"}
                </button>
              )}

              {user.verified && !user.suspended && (
                <button
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded"
                  onClick={() => handleUserAction(user._id, "unverify")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Unverify Account"}
                </button>
              )}
            </div>

            {/* User Posts Section */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">User Posts</h4>

              {postsLoading ? (
                <div className="text-center py-4">Loading posts...</div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div key={post._id} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-400">
                            {format(new Date(post.timestamp), "MMM d, yyyy")}
                          </p>
                          <p className="mt-1">
                            {post.content?.length > 100
                              ? post.content.substring(0, 100) + "..."
                              : post.content}
                          </p>

                          {/* Add media preview */}
                          {post.mediaUrl && post.mediaType === "image" && (
                            <div className="mt-2">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  post.mediaUrl
                                }`}
                                alt="Post image"
                                className="h-16 w-auto rounded object-cover"
                              />
                            </div>
                          )}
                          {post.mediaUrl && post.mediaType === "video" && (
                            <div className="mt-2">
                              <video
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  post.mediaUrl
                                }`}
                                className="h-16 w-auto rounded"
                              />
                            </div>
                          )}
                          {post.mediaUrl && post.mediaType === "audio" && (
                            <div className="mt-2">
                              <audio
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  post.mediaUrl
                                }`}
                                className="w-full h-6"
                              />
                            </div>
                          )}

                          {/* For backward compatibility */}
                          {!post.mediaUrl &&
                            post.images &&
                            post.images.length > 0 && (
                              <div className="mt-2 flex gap-2 overflow-x-auto">
                                {post.images.map((image, idx) => (
                                  <img
                                    key={idx}
                                    src={`${
                                      import.meta.env.VITE_BACKEND_URL
                                    }${image}`}
                                    alt={`Post image ${idx + 1}`}
                                    className="h-16 w-auto rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
                            onClick={() => {
                              setSelectedPost(post);
                              setPostModalOpen(true);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-400">
                        <span>❤️ {post.likes || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">This user has no posts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add this new component for post details modal
  const PostDetailModal = ({ post, onClose }) => {
    if (!post) return null;

    // Ensure the timestamp is valid before formatting
    const formattedTimestamp = post.timestamp
      ? format(new Date(post.timestamp), "MMM d, yyyy 'at' h:mm a")
      : "Unknown date";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Post Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    post.user?.profilePicture
                      ? `${import.meta.env.VITE_BACKEND_URL}${
                          post.user.profilePicture
                        }`
                      : "/dp/default-profile.png"
                  }
                  alt={post.user?.userName || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">
                    {post.user?.userName || "Unknown User"}
                  </p>
                  <p className="text-gray-400 text-sm">{formattedTimestamp}</p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Media content */}
              {post.mediaUrl && post.mediaType === "image" && (
                <div className="mt-4">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                    alt="Post image"
                    className="max-w-full rounded max-h-[400px] object-contain"
                  />
                </div>
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <div className="mt-4">
                  <video
                    src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                    controls
                    className="max-w-full rounded max-h-[400px]"
                  />
                </div>
              )}
              {post.mediaUrl && post.mediaType === "audio" && (
                <div className="mt-4">
                  <audio
                    src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                    controls
                    className="w-full"
                  />
                </div>
              )}

              {/* For backward compatibility */}
              {!post.mediaUrl && post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4">
                  {post.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={`${import.meta.env.VITE_BACKEND_URL}${image}`}
                      alt={`Post image ${idx + 1}`}
                      className="max-w-full rounded max-h-[400px] object-contain"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 text-sm text-gray-400">
              <span>❤️ {post.likes || 0} likes</span>
              <span>💬 {post.comments?.length || 0} comments</span>
            </div>

            {/* Comments section if available */}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Comments</h4>
                <div className="space-y-3">
                  {post.comments.map((comment, idx) => (
                    <div key={idx} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <img
                          src={
                            comment.user?.profilePicture
                              ? `${import.meta.env.VITE_BACKEND_URL}${
                                  comment.user.profilePicture
                                }`
                              : "/dp/default-profile.png"
                          }
                          alt={comment.user?.userName || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">
                            {comment.user?.userName || "Unknown User"}
                          </p>
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(comment.timestamp), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-2 ">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        Admin Dashboard
      </h2>

      {/* Navigation Tabs - Make scrollable on mobile */}
      <div className="flex mb-4 md:mb-6 border-b border-gray-700 overflow-x-auto pb-1 hide-scrollbar">
        <button
          className={`px-3 md:px-4 py-2 mr-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`px-3 md:px-4 py-2 mr-2 whitespace-nowrap ${
            activeTab === "users"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Statistics Grid - Improved responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<FaUsers />}
              bgColor="bg-blue-600"
            />
            <StatCard
              title="Total Artists"
              value={stats.totalArtists}
              icon={<FaPalette />}
              bgColor="bg-green-600"
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<FaGraduationCap />}
              bgColor="bg-purple-600"
            />
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={<FaBook />}
              bgColor="bg-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
            <StatCard
              title="Institutions"
              value={stats.totalInstitutions}
              icon={<FaBuilding />}
              bgColor="bg-indigo-600"
            />
            <StatCard
              title="Service Providers"
              value={stats.totalServiceProviders}
              icon={<FaTools />}
              bgColor="bg-pink-600"
            />
            <StatCard
              title="Total Posts"
              value={stats.totalPosts}
              icon={<FaNewspaper />}
              bgColor="bg-teal-600"
            />
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                Recent Users
              </h3>
              <div className="bg-gray-900 rounded-lg p-3 md:p-4 shadow-md">
                {recentActivity.users && recentActivity.users.length > 0 ? (
                  recentActivity.users.map((user, index) => (
                    <RecentUserItem key={index} user={user} />
                  ))
                ) : (
                  <p className="text-gray-400">No recent users to display</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                Recent Posts
              </h3>
              <div className="bg-gray-900 rounded-lg p-3 md:p-4 shadow-md">
                {recentActivity.posts && recentActivity.posts.length > 0 ? (
                  recentActivity.posts.map((post, index) => (
                    <RecentPostItem key={index} post={post} />
                  ))
                ) : (
                  <p className="text-gray-400">No recent posts to display</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-gray-900 rounded-lg p-4 md:p-6 shadow-md">
          <h3 className="text-lg md:text-xl font-semibold mb-4">
            User Management
          </h3>

          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by username or email"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                value={userSearchTerm}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
              />
            </div>

            <select
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on new filter
              }}
            >
              <option value="all">All Roles</option>
              <option value="artist">Artists</option>
              <option value="viewer/student">Students</option>
              <option value="institution">Institutions</option>
              <option value="service provider">Service Providers</option>
            </select>
          </div>

          {/* User Table */}
          {actionLoading && users.length === 0 ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-left">
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3">Posts</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="border-t border-gray-700 hover:bg-gray-800"
                        >
                          <td className="p-3">
                            <div className="flex items-center">
                              <img
                                src={
                                  user.profilePicture
                                    ? `${import.meta.env.VITE_BACKEND_URL}${
                                        user.profilePicture
                                      }`
                                    : "/dp/default-profile.png"
                                }
                                alt={user.userName}
                                className="w-8 h-8 rounded-full object-cover mr-3"
                              />
                              <div>
                                <p className="font-medium">{user.userName}</p>
                                <p className="text-sm text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                              {user.role}
                            </span>
                            {user.suspended && (
                              <span className="bg-red-600 text-xs px-2 py-1 rounded ml-1">
                                Suspended
                              </span>
                            )}
                            {user.verified && (
                              <span className="bg-green-600 text-xs px-2 py-1 rounded ml-1">
                                Verified
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="p-3">{user.numberOfPosts || 0}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewUserDetails(user._id)}
                                className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  handleUserAction(user._id, "suspend")
                                }
                                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                                disabled={actionLoading}
                              >
                                Suspend
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center">
                          No users found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <span className="text-sm text-gray-400">
                      Showing {indexOfFirstUser + 1}-
                      {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                      {filteredUsers.length} users
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentPage === 1
                          ? "bg-gray-700 text-gray-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      const pageNum =
                        currentPage > 3 ? currentPage - 3 + i + 1 : i + 1;

                      if (pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded ${
                              currentPage === pageNum
                                ? "bg-blue-600"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded ${
                        currentPage === totalPages
                          ? "bg-gray-700 text-gray-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {userModalOpen && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setUserModalOpen(false);
            setSelectedUser(null);
            setUserPosts([]);
          }}
        />
      )}

      {/* Post Detail Modal */}
      {postModalOpen && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => {
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
