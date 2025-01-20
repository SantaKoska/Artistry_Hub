import React, { useState, useEffect } from "react";
import { FaHome, FaBook, FaPlus, FaUser, FaEnvelope } from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";
import CreatePost from "../common/createPost"; // Import the CreatePost component
import axios from "axios"; // Assuming you use axios for API calls

const StudentBase = () => {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [userData, setUserData] = useState({
    userName: "",
    role: "",
    profilePicture: "", // Add profile picture
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
      <div className="bg-black shadow-lg backdrop-filter backdrop-blur-md bg-opacity-90 fixed top-0 w-full z-50 border-b border-yellow-500/20">
        <header className="flex justify-between items-center px-6 py-2">
          {/* Message Icon */}
          <div className="flex items-center">
            <Link
              to="/viewer-student-home/Message"
              className="text-gray-300 hover:text-yellow-400 transition-all duration-300 hover:scale-110"
            >
              <FaEnvelope size={22} aria-label="Messages" />
            </Link>
          </div>

          {/* Logo in the Center */}
          <div className="flex justify-center">
            <img
              src={Logo}
              alt="logo"
              className="w-14 h-14 hover:opacity-80 transition-opacity duration-300"
            />
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <span className="text-gray-100 font-medium">
                {userData.userName}
              </span>
              <span className="text-yellow-400 text-sm">{userData.role}</span>
            </div>
            <Link
              to="/viewer-student-home/studentprofile"
              className="transition-transform duration-300 hover:scale-105"
            >
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  userData.profilePicture
                }`}
                className="w-11 h-11 rounded-full border-2 border-yellow-400/30 hover:border-yellow-400 transition-colors duration-300"
                alt="Profile"
              />
            </Link>
          </div>
        </header>
      </div>

      {/* Main Content Section */}
      <div className="pt-20 pb-20 flex-grow h-full bg-black min-h-screen">
        <main className="w-full h-full">
          <Outlet />
        </main>
      </div>

      {/* Modal for Create Post */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative bg-zinc-900 text-white p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-yellow-500/20">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-yellow-400 focus:outline-none"
              onClick={() => setShowCreatePostModal(false)}
            >
              &#10005;
            </button>
            <CreatePost onClose={() => setShowCreatePostModal(false)} />
          </div>
        </div>
      )}

      {/* Footer Navigation Section */}
      <div className="bg-black shadow-lg backdrop-filter backdrop-blur-md bg-opacity-90 fixed bottom-0 w-full z-50 border-t border-yellow-500/20">
        <footer>
          <nav className="flex justify-around p-3 text-gray-300">
            {[
              { to: "/viewer-student-home", icon: <FaHome size={22} /> },
              {
                to: "/viewer-student-home/learning",
                icon: <FaBook size={22} />,
              },
              {
                icon: (
                  <FaPlus
                    size={22}
                    onClick={() => setShowCreatePostModal(true)}
                    className="cursor-pointer text-yellow-400 hover:scale-110 transition-transform duration-300"
                  />
                ),
              },
              {
                to: "/viewer-student-home/service-requests",
                icon: (
                  <span className="text-xl font-bold leading-none hover:text-yellow-400">
                    S
                  </span>
                ),
              },
            ].map(({ to, icon }, index) => (
              <div
                key={index}
                className="hover:text-yellow-400 transition-all duration-300 hover:scale-110"
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

export default StudentBase;
