import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BiUser } from "react-icons/bi";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

const ArtistProfile = () => {
  const [profile, setProfile] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [confirmationModalIsOpen, setConfirmationModalIsOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [posts, setPosts] = useState([]);
  const [logoutModalIsOpen, setLogoutModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    artForm: "",
    specialisation: "",
    userName: "",
    profilePicture: null,
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/artist/artist-profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        description: profileData.description,
        artForm: profileData.artForm,
        specialisation: profileData.specialisation,
        userName: profileData.userName,
      });
      setPosts(profileData.postsinfo || []);
    } catch (error) {
      toast.error(`Error fetching profile: ${error.response?.data?.err}`);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleOpenModal = () => setModalIsOpen(true);
  const handleCloseModal = () => setModalIsOpen(false);

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    try {
      await axios.put(
        "http://localhost:8000/artist/artist-editprofile",
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

  const handleOpenLogoutModal = () => setLogoutModalIsOpen(true);
  const handleCloseLogoutModal = () => setLogoutModalIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleOpenConfirmationModal = (postId) => {
    setPostToDelete(postId);
    setConfirmationModalIsOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setPostToDelete(null);
    setConfirmationModalIsOpen(false);
  };

  const handleDeletePost = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/posts/delete-post/${postToDelete}`,
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

  return (
    <>
      <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full max-w-screen-lg mt-36 mb-16">
        {profile && (
          <>
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex flex-col items-center">
                <img
                  src={`http://localhost:8000${profile.profilePicture}`}
                  alt="Profile"
                  className="w-48 h-44 rounded-full mb-4"
                />
                <h1 className="text-5xl font-semibold text-yellow-400 mt-4 text-center">
                  {profile.userName}
                </h1>
              </div>
              <div className="flex flex-col justify-center text-white text-lg space-y-6 w-full">
                <div className="flex justify-between md:justify-start gap-x-10">
                  <div className="text-center">
                    <p className="font-bold text-3xl text-yellow-400">
                      Followers
                    </p>
                    <p>{profile.followerCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-3xl text-yellow-400">Posts</p>
                    <p>{profile.numberOfPosts}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-xl">
                    Description: {profile.description}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-xl">
                    Art Form: {profile.artForm}
                  </p>
                  <p className="font-semibold text-xl">
                    Specialization: {profile.specialisation}
                  </p>
                </div>
                <button
                  onClick={handleOpenModal}
                  className="w-full md:w-64 text-[18px] font-semibold rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleOpenLogoutModal}
                  className="w-full md:w-64 text-[18px] font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 py-2 transition-colors duration-400"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Posts Section */}
            <div className="mt-10">
              <h2 className="text-3xl text-white mb-4">Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-blue-100  rounded-lg p-4 text-black"
                    >
                      {post.mediaUrl && post.mediaType === "image" && (
                        <img
                          src={`http://localhost:8000${post.mediaUrl}`}
                          alt="Post media"
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === "video" && (
                        <video
                          controls
                          src={`http://localhost:8000${post.mediaUrl}`}
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === "audio" && (
                        <audio
                          controls
                          src={`http://localhost:8000${post.mediaUrl}`}
                          className="w-full object-cover rounded-lg mb-2"
                        />
                      )}
                      <p>{post.content}</p>
                      <p className="text-sm text-emerald-900">
                        Posted on: {new Date(post.timestamp).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleOpenConfirmationModal(post._id)}
                        className="mt-2 p-1 text-red-500 hover:text-white font-semibold rounded-full bg-white hover:bg-red-500 py-2 transition-colors duration-400"
                      >
                        Delete Post
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-white">No posts available.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        <Modal
          isOpen={confirmationModalIsOpen}
          onRequestClose={handleCloseConfirmationModal}
          className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full md:w-1/3 mx-auto"
          overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        >
          <h2 className="text-white text-2xl mb-4">Confirm Deletion</h2>
          <p className="text-white mb-4">
            Are you sure you want to delete this post?
          </p>
          <div className="flex justify-between">
            <button
              onClick={handleDeletePost}
              className="w-1/2 text-[18px] font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 py-2 transition-colors duration-400"
            >
              Yes, Delete
            </button>
            <button
              onClick={handleCloseConfirmationModal}
              className="w-1/2 text-[18px] font-semibold rounded-full bg-green-500 text-white hover:bgc py-2 transition-colors duration-400"
            >
              No, Cancel
            </button>
          </div>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={handleCloseModal}
          className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full md:w-2/3 lg:w-1/2 mx-auto"
          overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        >
          <h2 className="text-white text-2xl mb-4">Edit Profile</h2>
          <form onSubmit={handleSave}>
            <div className="flex flex-col space-y-4">
              <label htmlFor="description" className="text-white">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="p-2 rounded-md bg-slate-600 text-white"
              />
              <label htmlFor="artForm" className="text-white">
                Art Form
              </label>
              <input
                id="artForm"
                value={formData.artForm}
                onChange={(e) =>
                  setFormData({ ...formData, artForm: e.target.value })
                }
                className="p-2 rounded-md bg-slate-600 text-white"
              />
              <label htmlFor="specialisation" className="text-white">
                Specialization
              </label>
              <input
                id="specialisation"
                value={formData.specialisation}
                onChange={(e) =>
                  setFormData({ ...formData, specialisation: e.target.value })
                }
                className="p-2 rounded-md bg-slate-600 text-white"
              />
              <label htmlFor="userName" className="text-white">
                Username
              </label>
              <input
                id="userName"
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
                className="p-2 rounded-md bg-slate-600 text-white"
              />
              <label htmlFor="profilePicture" className="text-white">
                Profile Picture
              </label>
              <input
                id="profilePicture"
                type="file"
                onChange={handleFileChange}
                className="p-2 rounded-md bg-slate-600 text-white"
              />
              <button
                type="submit"
                className="w-full md:w-64 text-[18px] font-semibold rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={logoutModalIsOpen}
          onRequestClose={handleCloseLogoutModal}
          className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full md:w-1/3 mx-auto"
          overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        >
          <h2 className="text-white text-2xl mb-4">Confirm Logout</h2>
          <p className="text-white mb-4">Are you sure you want to log out?</p>
          <div className="flex justify-between">
            <button
              onClick={() => {
                handleLogout();
                handleCloseLogoutModal();
              }}
              className="w-1/2 text-[18px] font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 py-2 transition-colors duration-400"
            >
              Yes, Logout
            </button>
            <button
              onClick={handleCloseLogoutModal}
              className="w-1/2 text-[18px] font-semibold rounded-full bg-green-500 text-white hover:bg-green-600 py-2 transition-colors duration-400"
            >
              No, Cancel
            </button>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default ArtistProfile;
