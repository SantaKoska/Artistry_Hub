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
      setProfile(response.data);
      setFormData({
        description: response.data.description,
        artForm: response.data.artForm,
        specialisation: response.data.specialisation,
        userName: response.data.userName,
      });
    } catch (error) {
      toast.error(`Error fetching profile: ${error.response?.data?.err}`);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleOpenModal = () => {
    setModalIsOpen(true);
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
  };

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
      toast.error(`Error updating profile ${error.response?.data?.err}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // to clear the token
    navigate("/login"); // to redirect to the login page
  };

  return (
    <>
      <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full max-w-screen-lg mx-auto mt-8">
        {profile && (
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex flex-col items-center">
              <img
                src={`http://localhost:8000${profile.profilePicture}`}
                alt="Profile"
                className="w-48 h-48 md:w-56 md:h-56 rounded-full mb-4"
              />
              <h1 className="text-5xl font-semibold text-white mt-4 text-center">
                {profile.userName}
              </h1>
            </div>
            <div className="flex flex-col justify-center text-white text-lg space-y-6 w-full">
              <div className="flex justify-between md:justify-start gap-x-10">
                <div className="text-center">
                  <p className="font-bold text-3xl">Followers</p>
                  <p>{profile.followerCount}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-3xl">Posts</p>
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
                onClick={handleLogout}
                className="w-full md:w-64 text-[18px] font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 py-2 transition-colors duration-400"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={handleCloseModal}
          className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full md:w-1/3 mx-auto"
          overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        >
          <h2 className="text-white text-2xl mb-4">Edit Profile</h2>
          <form className="w-full">
            <div className="relative mb-8">
              <input
                type="file"
                onChange={handleFileChange}
                className="text-white"
              />
              <label className="absolute text-white text-lg">
                Profile Image
              </label>
            </div>
            <div className="relative mb-8">
              <input
                type="text"
                value={formData.userName}
                onChange={(e) =>
                  setFormData({ ...formData, userName: e.target.value })
                }
                className="block w-full py-2.4 px-0 text-base text-white font-semibold border-0 border-b-2 border-emerald-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                required
              />
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
                Username
              </label>
              <BiUser className="absolute top-0 right-4 peer-focus:text-yellow-500" />
            </div>
            {/* Description Field */}
            <div className="relative mb-8">
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="block w-full py-2.4 px-0 text-base text-white font-semibold border-0 border-b-2 border-emerald-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                required
              />
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
                Description
              </label>
            </div>
            {/* Art Form Field */}
            <div className="relative mb-8">
              <select
                value={formData.artForm}
                onChange={(e) =>
                  setFormData({ ...formData, artForm: e.target.value })
                }
                className="block w-full py-2.4 px-0 text-base text-white font-semibold border-0 border-b-2 border-emerald-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              >
                <option value="">Select Art Form</option>
                <option value="Painting">Painting</option>
                <option value="Sculpture">Sculpture</option>
                <option value="Architecture">Architecture</option>
                <option value="Literature">Literature</option>
                <option value="Cinema">Cinema</option>
                <option value="Theater">Theater</option>
                <option value="Music">Music</option>
              </select>
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
                Art Form
              </label>
            </div>
            {/* Specialization Field */}
            <div className="relative mb-8">
              <input
                type="text"
                value={formData.specialisation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specialisation: e.target.value,
                  })
                }
                className="block w-full py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:border-yellow-500 focus:outline-none peer"
                required
              />
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
                Specialization
              </label>
            </div>

            <button
              onClick={handleSave}
              className="w-full text-[18px] font-semibold rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
            >
              Save
            </button>
          </form>
        </Modal>
      </div>
    </>
  );
};

export default ArtistProfile;