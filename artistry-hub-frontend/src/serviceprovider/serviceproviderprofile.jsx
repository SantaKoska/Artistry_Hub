import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";

const ServiceProviderProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [confirmationModalIsOpen, setConfirmationModalIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [logoutModalIsOpen, setLogoutModalIsOpen] = useState(false);
  const [followersModalIsOpen, setFollowersModalIsOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [formData, setFormData] = useState({
    description: "",
    expertise: "",
    ownerName: "",
    userName: "",
    profilePicture: null,
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/service/service-provider-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile(data);
        setFormData({
          description: data.description,
          expertise: data.expertise,
          ownerName: data.ownerName,
          userName: data.userName,
        });
        setPosts(data.postsInfo || []);
      } catch (error) {
        toast.error(`Error fetching profile: ${error.response?.data?.err}`);
      }
    };

    fetchProfile();
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
      const response = await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/service/service-provider-editprofile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(response.data.success || "Profile updated successfully");
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

  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  const Post = ({ post }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentLimit = 100;

    const toggleReadMore = () => {
      setIsExpanded((prev) => !prev);
    };

    return (
      <div key={post._id} className="bg-blue-100 rounded-lg p-4 text-black">
        {post.mediaUrl && post.mediaType === "image" && (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            alt="Post"
            className="w-full h-48 object-cover rounded-lg mb-2"
          />
        )}
        {post.mediaUrl && post.mediaType === "video" && (
          <video
            controls
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            className="w-full h-48 object-cover rounded-lg mb-2"
          />
        )}
        {post.mediaUrl && post.mediaType === "audio" && (
          <audio
            controls
            src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
            className="w-full object-cover rounded-lg mb-2"
          />
        )}

        <p>
          {isExpanded ? post.content : truncateText(post.content, contentLimit)}
          {post.content.length > contentLimit && (
            <button
              onClick={toggleReadMore}
              className="text-blue-600 font-semibold ml-2"
            >
              {isExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </p>

        <p className="text-sm text-emerald-900">
          Posted on: {new Date(post.timestamp).toLocaleString()}
        </p>
        <button
          onClick={() => handleOpenConfirmationModal(post._id)}
          className="mt-2 text-red-500 font-semibold rounded-full bg-white hover:bg-red-500 hover:text-white py-2 px-4 transition-colors duration-400"
        >
          <FaTrash className="text-red-500" />
        </button>
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
                      Owner Name
                    </h3>
                    <p className="text-gray-200">{profile.ownerName}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Expertise
                    </h3>
                    <p className="text-gray-200">{profile.expertise}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              My Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post._id} post={post} />)
              ) : (
                <p className="text-gray-400 col-span-full text-center">
                  No posts available.
                </p>
              )}
            </div>
          </div>

          {/* Add Followers Modal */}
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
                        {follower.expertise}
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

          {/* Edit Profile Modal */}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={handleCloseModal}
            className="modal bg-gray-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-2/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-yellow-400 text-2xl mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Form Fields */}
              {Object.entries(formData).map(([key, value]) => (
                <div className="flex flex-col" key={key}>
                  <label htmlFor={key} className="text-white">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  {key === "description" ? (
                    <textarea
                      id={key}
                      className="bg-gray-700 rounded p-2 text-white"
                      value={value}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      id={key}
                      type={key === "profilePicture" ? "file" : "text"}
                      className="bg-gray-700 rounded p-2 text-white"
                      value={key !== "profilePicture" ? value : undefined}
                      onChange={
                        key === "profilePicture"
                          ? handleFileChange
                          : (e) =>
                              setFormData({
                                ...formData,
                                [key]: e.target.value,
                              })
                      }
                    />
                  )}
                </div>
              ))}

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
                  className="bg-yellow-400 text-black rounded px-4 py-2 hover:bg-yellow-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Modal>

          {/* Confirmation Modal for Delete Post */}
          <Modal
            isOpen={confirmationModalIsOpen}
            onRequestClose={handleCloseConfirmationModal}
            className="modal bg-gray-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-yellow-400 text-2xl mb-4">Confirm Deletion</h2>
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

          {/* Logout Confirmation Modal */}
          <Modal
            isOpen={logoutModalIsOpen}
            onRequestClose={handleCloseLogoutModal}
            className="modal bg-gray-800 rounded-md p-8 shadow-lg backdrop-blur-md w-full md:w-1/3 mx-auto"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
          >
            <h2 className="text-yellow-400 text-2xl mb-4">Confirm Logout</h2>
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
        </div>
      )}
    </div>
  );
};

export default ServiceProviderProfile;
