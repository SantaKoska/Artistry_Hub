import React, { useState, useEffect } from "react";
import { FaHome, FaUser, FaPlus, FaEnvelope } from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";
import CreatePost from "../common/createPost"; // Import the CreatePost component
import axios from "axios"; // Assuming you use axios for API calls

const ServiceProviderBase = () => {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [userData, setUserData] = useState({
    userName: "",
    role: "",
    profilePicture: "", // Profile picture for the user
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/common-things/usericon`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserData(response.data.profile);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      {/* Header Section */}
      <div className="bg-black shadow-lg backdrop-filter backdrop-blur-md bg-opacity-90 fixed top-0 w-full z-50">
        <header className="flex justify-between items-center px-4 py-2">
          {/* Message Icon */}
          <div className="flex items-center">
            <Link
              to="/Service-Provider-home/Message"
              className="text-yellow-400 hover:text-white transition-colors duration-300"
            >
              <FaEnvelope size={20} aria-label="Messages" />
            </Link>
          </div>

          {/* Logo in the Center */}
          <div className="flex justify-center">
            <img src={Logo} alt="logo" className="w-12 h-12" />
          </div>

          {/* Profile Picture and Username on the Right */}
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="text-white font-semibold">
                {userData.userName}
              </span>
              <span className="text-gray-300 text-sm">{userData.role}</span>
            </div>
            <Link
              to="/Service-Provider-home/serviceproviderprofile"
              className="text-yellow-400 hover:text-white transition-colors duration-300"
            >
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  userData.profilePicture
                }`}
                className="w-10 h-10 rounded-full border-2 border-yellow-400" // Added border for better visibility
              />
            </Link>
          </div>
        </header>
      </div>

      {/* Main Content Section */}
      <div className="pt-16 pb-16 flex-grow h-full bg-black text-white">
        <main className="w-full h-full">
          <Outlet />
        </main>
      </div>

      {/* Modal for Create Post */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative bg-gray-800 text-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-yellow-400 focus:outline-none"
              onClick={() => setShowCreatePostModal(false)}
            >
              &#10005; {/* Close icon */}
            </button>
            <CreatePost onClose={() => setShowCreatePostModal(false)} />
          </div>
        </div>
      )}

      {/* Footer Navigation Section */}
      <div className="bg-black shadow-lg backdrop-filter backdrop-blur-md bg-opacity-90 fixed bottom-0 w-full z-50">
        <footer>
          <nav className="flex justify-around p-2 text-white">
            {[
              { to: "/Service-Provider-home", icon: <FaHome size={20} /> },
              {
                icon: (
                  <FaPlus
                    size={20}
                    onClick={() => setShowCreatePostModal(true)} // Show modal on click
                    className="cursor-pointer"
                  />
                ),
              },
            ].map(({ to, icon }, index) => (
              <div
                key={index}
                className="hover:text-yellow-400 transition-colors duration-300"
              >
                {to ? (
                  <Link to={to} aria-label={to}>
                    {icon}
                  </Link>
                ) : (
                  icon
                )}
              </div>
            ))}
          </nav>
        </footer>
      </div>
    </>
  );
};

export default ServiceProviderBase;
