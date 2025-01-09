import React, { useState, useEffect } from "react";
import { FaHome, FaBook, FaPlus, FaUser, FaEnvelope } from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";
import axios from "axios";

const InstitutionBase = () => {
  const [userData, setUserData] = useState({
    userName: "",
    role: "",
    profilePicture: "",
  });

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
      <div className="bg-slate-800 shadow-lg fixed top-0 w-full z-50">
        <header className="flex justify-between items-center px-4 py-1">
          <div className="flex items-center">
            <Link
              to="/institution-home/Message"
              className="text-white hover:text-yellow-400"
            >
              <FaEnvelope size={20} aria-label="Messages" />
            </Link>
          </div>
          <div className="flex justify-center">
            <img src={Logo} alt="logo" className="w-12 h-12" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="text-white">{userData.userName}</span>
              <span className="text-gray-400 text-sm">{userData.role}</span>
            </div>
            <Link
              to="/institution-home/institutionprofile"
              className="text-white hover:text-yellow-400"
            >
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${
                  userData.profilePicture
                }`}
                className="w-10 h-10 rounded-full"
              />
            </Link>
          </div>
        </header>
      </div>
      <div className="pt-16 pb-16 flex-grow h-full">
        <main className="w-full h-full">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default InstitutionBase;
