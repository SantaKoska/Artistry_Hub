import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function AdminBase() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/admin");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-white flex flex-col">
      {/* Admin Navigation Header - Fixed at top */}
      <nav className="bg-gray-800 p-4 shadow-md z-10">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="hover:text-blue-400 px-3 py-1.5 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-1.5 md:py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area with full height */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-2 md:p-4 max-w-7xl h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminBase;
