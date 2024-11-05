import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";

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
          className="mt-2 text-red-500 font-semibold rounded-full bg-white hover:bg-red-500 py-2 px-4 transition-colors duration-400"
        >
          Delete Post
        </button>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-blur-md bg-opacity-30 max-w-screen-lg mx-auto">
      {profile && (
        <>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex flex-col items-center">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  profile.profilePicture
                }`}
                alt="Profile"
                className="w-48 h-44 rounded-full mb-4"
              />
              <h1 className="text-5xl font-semibold text-yellow-400 mt-4">
                {profile.userName}
              </h1>
            </div>
            <div className="text-white space-y-6 w-full">
              <div className="flex justify-between md:justify-start gap-10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    Followers
                  </p>
                  <p>{profile.followerCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">Posts</p>
                  <p>{profile.numberOfPosts}</p>
                </div>
              </div>
              <p className="text-xl font-semibold">
                Description: {profile.description}
              </p>
              <p className="text-xl font-semibold">
                Art Form: {profile.artForm}
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleOpenModal}
                  className="w-full md:w-64 text-lg font-semibold bg-white text-black hover:bg-emerald-900 hover:text-white py-2 rounded-full transition-colors duration-400"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleOpenLogoutModal}
                  className="w-full md:w-64 text-lg font-semibold bg-red-500 text-white hover:bg-red-600 py-2 rounded-full transition-colors duration-400"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-3xl text-white mb-4">Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post._id} post={post} />)
              ) : (
                <p className="text-white">No posts available.</p>
              )}
            </div>
          </div>

          {/* Delete Post Confirmation Modal */}
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

          {/* Logout Confirmation Modal */}
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

          {/* Edit Profile Modal */}
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
        </>
      )}
    </div>
  );
};

export default StudentProfile;
