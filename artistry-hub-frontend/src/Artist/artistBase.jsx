import React, { useState } from "react";
import { FaHome, FaBook, FaPlus, FaUser } from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";
import CreatePost from "./CreatePost"; // Import the CreatePost component

const ArtistBase = () => {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  return (
    <>
      {/* Header Section */}
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed top-0 w-full z-50">
        <header>
          <div className="flex justify-center py-1">
            <img src={Logo} alt="logo" className="w-12 h-12" />
          </div>
        </header>
      </div>

      {/* Main Content Section */}
      <div className="pt-14 pb-16 flex-grow h-full">
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
                    className="cursor-pointer"
                  />
                ),
              },
              {
                to: "/artist-Home/Service-Request",
                icon: <span className="text-xl font-bold leading-none">S</span>,
              },
              { to: "/artist-Home/artistprofile", icon: <FaUser size={20} /> },
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
