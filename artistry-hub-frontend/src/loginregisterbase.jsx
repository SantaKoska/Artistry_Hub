import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Logo from "./assets/LOGO.png"; // Ensure the path is correct

const LoginRegisterBase = () => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed top-0 w-full z-50">
        <header className="flex justify-between items-center p-4">
          {/* Left section with About and Contact */}
          <nav className="flex space-x-6">
            <button
              onClick={() => setShowAboutModal(true)}
              className="text-white hover:text-yellow-400 focus:outline-none"
            >
              About
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-white hover:text-yellow-400 focus:outline-none"
            >
              Contact
            </button>
          </nav>

          {/* Logo on the right */}
          <div>
            <img src={Logo} alt="Logo" className="w-16 h-16" />
          </div>
        </header>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-16 flex justify-center items-center min-h-screen bg-gradient-to-b relative">
        {/* Overlay for backdrop filter */}
        <div className="absolute inset-0 opacity-30 z-0"></div>

        <main className="relative z-10 w-full max-w-lg p-8 overflow-y-auto shadow-lg">
          {/* Dynamic content from login/register */}
          <Outlet />
        </main>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAboutModal(false)}
            >
              &#10005; {/* Close button */}
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-emerald-900">
              About ArtistryHub
            </h2>
            <p className="text-gray-700 text-center ">
              ArtistryHub is a platform that connects artists, students and
              service providers. We provide tools forlearning, collaboration,
              and showcasing art. Whether you're looking to view art, learn,
              collaborate, or offer services, ArtistryHub brings the art
              community together in one seamless space.
            </p>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowContactModal(false)}
            >
              &#10005; {/* Close button */}
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-emerald-900">
              Contact Us
            </h2>
            <p className="text-gray-700 text-center mb-4">
              Have any questions? Reach out to us at:
            </p>
            <p className="text-yellow-500 text-center">
              kamalsankarm2025@mca.ajce.in
            </p>
            <p className="text-yellow-500 text-center">+91-9539995091</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed bottom-0 w-full z-50">
        <footer className="text-center p-4 text-white">
          <p>
            &copy; {new Date().getFullYear()} ArtistryHub. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
};

export default LoginRegisterBase;
