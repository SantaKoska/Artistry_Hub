import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

const InstitutionProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    type: "",
    focusArea: "",
    userName: "",
    profilePicture: null,
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch institution profile
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
        description: data.description || "",
        type: data.type || "",
        focusArea: data.focusArea || "",
        userName: data.userName || "",
      });
      setPosts(data.postsinfo || []);
    } catch (error) {
      toast.error(`Error fetching profile: ${error.response?.data?.err}`);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  // Handle file change for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, profilePicture: file }));
    } else {
      toast.error("Please upload a valid image file");
    }
  };

  // Update institution profile
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
      setModalIsOpen(false);
      fetchProfile();
    } catch (error) {
      toast.error(`Error updating profile: ${error.response?.data?.err}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="bg-gray-800 rounded-md p-8 shadow-lg backdrop-blur-md bg-opacity-30 max-w-screen-lg mx-auto">
      {profile && (
        <>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  profile.profilePicture
                }`}
                alt="Institution Logo"
                className="w-48 h-48 rounded-full mb-4"
              />
              <h1 className="text-5xl font-semibold text-yellow-400 mt-4">
                {profile.userName}
              </h1>
            </div>

            {/* Profile Details */}
            <div className="text-white space-y-6 w-full">
              <p className="text-xl font-semibold">
                Description: {profile.description}
              </p>
              <p className="text-xl font-semibold">Type: {profile.type}</p>
              <p className="text-xl font-semibold">
                Focus Area: {profile.focusArea}
              </p>
              <p className="text-xl font-semibold">
                Followers: {profile.followerCount}
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setModalIsOpen(true)}
                  className="w-full md:w-64 text-lg font-semibold bg-white text-black hover:bg-blue-500 hover:text-white py-2 rounded-full transition-colors duration-400"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full md:w-64 text-lg font-semibold bg-red-500 text-white hover:bg-red-600 py-2 rounded-full transition-colors duration-400"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-10">
            <h2 className="text-3xl text-yellow-400 mb-4 font-semibold">
              Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post._id} className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-white">
                    {post.content.length > 100
                      ? post.content.substring(0, 100) + "..."
                      : post.content}
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    Posted on: {new Date(post.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Profile Modal */}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Focus Area"
                value={formData.focusArea}
                onChange={(e) =>
                  setFormData({ ...formData, focusArea: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full p-2"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
};

export default InstitutionProfile;
