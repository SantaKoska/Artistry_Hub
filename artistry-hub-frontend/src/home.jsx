import React from "react";
import { FaGithub } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "./assets/LOGO.png"; // Assuming you have a logo to include

const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
      <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
        <div className="flex justify-center mb-10 mx-20">
          {/* Space for logo */}
          <img src={Logo} alt="logo" className="w-62 h-auto" />
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-center mb-6 text-white">
            Artistry Hub
          </h1>
          <p className="text-xl text-center text-gray-300 mb-6">
            Our website is currently under development.
          </p>
          <p className="text-lg text-center text-gray-400 mb-8">
            Stay tuned for exciting updates!
          </p>
          <div className="flex justify-center items-center mb-6">
            <a
              href="https://github.com/SantaKoska/Artistry_Hub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-yellow-400 hover:text-yellow-500 transition duration-300"
            >
              <FaGithub className="mr-2 text-xl" />
              Visit Our GitHub Repository
            </a>
          </div>
          {/* Logout Button */}
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="bg-white text-red-500 font-semibold py-2 px-6 rounded-full hover:bg-red-500 hover:text-white transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
