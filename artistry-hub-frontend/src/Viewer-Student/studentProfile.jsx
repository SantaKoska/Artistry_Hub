import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

Modal.setAppElement("#root");

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [confirmationModalIsOpen, setConfirmationModalIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [logoutModalIsOpen, setLogoutModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    artForm: "",
    userName: "",
    profilePicture: null,
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/student/student-profile`, // Adjusted to student profile route
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(data);
      setFormData({
        description: data.description,
        artForm: data.artForm,
        userName: data.userName,
      });
      setPosts(data.postsinfo || []);
    } catch (error) {
      toast.error(`Error fetching profile: ${error.response?.data?.err}`);
    }
  };

  useEffect(() => {
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
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/student/student-editprofile`, // Adjusted to student edit profile route
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
      console.log(error);
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
        className="bg-zinc-800 rounded-xl border border-yellow-500/20 p-6
        hover:border-yellow-500/40 transition-all duration-300"
      >
        {post.mediaUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {post.mediaType === "image" && (
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                alt="Post"
                className="w-full h-48 object-cover"
              />
            )}
            {post.mediaType === "video" && (
              <video
                controls
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                className="w-full h-48 object-cover"
              />
            )}
            {post.mediaType === "audio" && (
              <audio
                controls
                src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                className="w-full"
              />
            )}
          </div>
        )}
        <p className="text-gray-300 mb-3">
          {isExpanded ? post.content : truncateText(post.content, contentLimit)}
          {post.content.length > contentLimit && (
            <button
              onClick={toggleReadMore}
              className="text-red-400 hover:text-red-300 transition-colors duration-300"
            >
              {isExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {new Date(post.timestamp).toLocaleDateString()}
          </span>
          <button
            onClick={() => handleOpenConfirmationModal(post._id)}
            className="text-red-400 hover:text-red-300 transition-colors duration-300"
          >
            <FaTrash className="text-red-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {profile && (
        <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-2xl p-8">
          {/* Profile Header Section */}
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    profile.profilePicture
                  }`}
                  alt="Profile"
                  className="w-48 h-48 rounded-full object-cover border-4 border-yellow-500/30 
                    group-hover:border-yellow-400 transition-all duration-300 shadow-xl"
                />
              </div>
              <h1 className="text-4xl font-bold text-yellow-400 mt-6">
                {profile.userName}
              </h1>
            </div>

            {/* Profile Stats & Info */}
            <div className="flex-1 space-y-8">
              <div className="flex justify-start gap-12">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400 mb-1">
                    Followers
                  </p>
                  <p className="text-gray-300 text-xl">
                    {profile.followerCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400 mb-1">
                    Posts
                  </p>
                  <p className="text-gray-300 text-xl">
                    {profile.numberOfPosts}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-yellow-400 text-lg font-semibold mb-1">
                    Description
                  </h2>
                  <p className="text-gray-300">{profile.description}</p>
                </div>
                <div>
                  <h2 className="text-yellow-400 text-lg font-semibold mb-1">
                    Art Form
                  </h2>
                  <p className="text-gray-300">{profile.artForm}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleOpenModal}
                  className="px-6 py-2.5 bg-zinc-800 text-yellow-400 rounded-lg border border-yellow-500/30
                    hover:bg-zinc-700 hover:border-yellow-400 transition-all duration-300"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleOpenLogoutModal}
                  className="px-6 py-2.5 bg-red-900/50 text-red-100 rounded-lg border border-red-500/30
                    hover:bg-red-900 hover:border-red-400 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post._id} post={post} />)
              ) : (
                <p className="text-gray-400 col-span-full text-center py-8">
                  No posts available.
                </p>
              )}
            </div>
          </div>

          {/* Delete Post Confirmation Modal */}
          <Modal
            isOpen={confirmationModalIsOpen}
            onRequestClose={handleCloseConfirmationModal}
            className="modal bg-zinc-900 rounded-xl p-8 shadow-2xl w-full max-w-2xl mx-auto border border-yellow-500/20"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 p-4"
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              Confirm Deletion
            </h2>
            <p className="text-gray-300">
              Are you sure you want to delete this post?
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseConfirmationModal}
                className="bg-zinc-800 text-yellow-400 rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="bg-red-900/50 text-red-100 rounded px-4 py-2"
              >
                Delete
              </button>
            </div>
          </Modal>

          {/* Logout Confirmation Modal */}
          <Modal
            isOpen={logoutModalIsOpen}
            onRequestClose={handleCloseLogoutModal}
            className="modal bg-zinc-900 rounded-xl p-8 shadow-2xl w-full max-w-2xl mx-auto border border-yellow-500/20"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 p-4"
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              Confirm Logout
            </h2>
            <p className="text-gray-300">Are you sure you want to logout?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseLogoutModal}
                className="bg-zinc-800 text-yellow-400 rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-900/50 text-red-100 rounded px-4 py-2"
              >
                Logout
              </button>
            </div>
          </Modal>

          {/* Edit Profile Modal */}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={handleCloseModal}
            className="modal bg-zinc-900 rounded-xl p-8 shadow-2xl w-full max-w-2xl mx-auto border border-yellow-500/20"
            overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 p-4"
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">
              Edit Profile
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col">
                <label htmlFor="userName" className="text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="userName"
                  type="text"
                  className="bg-zinc-800 border border-yellow-500/20 rounded-lg p-2.5 text-gray-100
                    focus:border-yellow-500/50 focus:outline-none transition-colors"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="description" className="text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  className="bg-zinc-800 border border-yellow-500/20 rounded-lg p-2.5 text-gray-100
                    focus:border-yellow-500/50 focus:outline-none transition-colors"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="artForm" className="text-gray-300 mb-2">
                  Art Form
                </label>
                <input
                  id="artForm"
                  type="text"
                  className="bg-zinc-800 border border-yellow-500/20 rounded-lg p-2.5 text-gray-100
                    focus:border-yellow-500/50 focus:outline-none transition-colors"
                  value={formData.artForm}
                  onChange={(e) =>
                    setFormData({ ...formData, artForm: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="profilePicture" className="text-gray-300 mb-2">
                  Profile Picture
                </label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="bg-zinc-800 border border-yellow-500/20 rounded-lg p-2.5 text-gray-100
                    focus:border-yellow-500/50 focus:outline-none transition-colors"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-zinc-800 text-yellow-400 rounded px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-400 text-zinc-900 rounded px-4 py-2"
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

export default StudentProfile;
