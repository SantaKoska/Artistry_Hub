import React, { useState, useEffect } from "react";
import { FaHome, FaBook, FaPlus, FaUser, FaEnvelope } from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";
import CreatePost from "../common/createPost"; // Import the CreatePost component
import axios from "axios"; // Assuming you use axios for API calls

const ArtistBase = () => {
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
          "http://localhost:8000/common-things/usericon",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserData(response.data.profile);
        // console.log(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      {/* Header Section */}
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed top-0 w-full z-50">
        <header className="flex justify-between items-center px-4 py-1">
          {/* Message Icon */}
          <div className="flex items-center">
            <Link
              to="/artist-Home/Message"
              className="text-white hover:text-yellow-400 transition-colors duration-300"
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
              <span className="text-white">{userData.userName}</span>
              <span className="text-gray-400 text-sm">{userData.role}</span>
            </div>
            <Link
              to="/artist-Home/artistprofile"
              className="text-white hover:text-yellow-400 transition-colors duration-300"
            >
              <img
                src={`http://localhost:8000${userData.profilePicture}`}
                className="w-10 h-10 rounded-full" // Ensure it's styled as a circle
              />
            </Link>
          </div>
        </header>
      </div>

      {/* Main Content Section */}
      <div className="pt-16 pb-16 flex-grow h-full">
        <main className="w-full h-full">
          <Outlet />
        </main>
      </div>

      {/* Modal for Create Post */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-slate-800 text-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-white focus:outline-none"
              onClick={() => setShowCreatePostModal(false)}
            >
              &#10005; {/* Close icon */}
            </button>
            <CreatePost onClose={() => setShowCreatePostModal(false)} />
          </div>
        </div>
      )}

      {/* Footer Navigation Section */}
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed bottom-0 w-full z-50">
        <footer>
          <nav className="flex justify-around p-2 text-white">
            {[
              { to: "/artist-Home", icon: <FaHome size={20} /> },
              { to: "/artist-Home/my-courses", icon: <FaBook size={20} /> },
              {
                icon: (
                  <FaPlus
                    size={20}
                    onClick={() => setShowCreatePostModal(true)} // Show modal on click
                    id="create-post-button"
                  />
                ),
              },
              {
                to: "/artist-Home/Service-Request",
                icon: (
                  <span
                    id="service-request"
                    className="text-xl font-bold leading-none"
                  >
                    S
                  </span>
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

export default ArtistBase;
