import {
  FaHome,
  FaEnvelope,
  FaBook,
  FaPlus,
  FaBriefcase,
  FaUser,
} from "react-icons/fa"; // Import icons
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";

const ArtistBase = () => {
  return (
    <>
      <div className="bg-slate-800 rounded-none shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed top-0 w-full z-50">
        <header>
          <div className="flex justify-center mb-0 mx-0">
            {/* space for logo */}
            <img src={Logo} alt="logo" className="w-20 h-20" />
          </div>
        </header>
      </div>

      <div>
        <main>
          <Outlet />
        </main>
      </div>

      <div className="bg-slate-800 rounded-none shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed bottom-0 w-full z-50">
        {/* this footer contain  the navigation too each sectioo of the application this wont load each time the main changes */}
        <footer>
          <nav className="flex justify-around p-4 text-white">
            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/artist-Home" aria-label="Home">
                <FaHome size={24} />
              </Link>
            </div>

            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/messages" aria-label="Messages">
                <FaEnvelope size={24} />
              </Link>
            </div>

            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/learning-platform" aria-label="Learning Platform">
                <FaBook size={24} />
              </Link>
            </div>

            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/create-post" aria-label="Create Post">
                <FaPlus size={24} />
              </Link>
            </div>

            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/job-finding" aria-label="Job Finding">
                <FaBriefcase size={24} />
              </Link>
            </div>

            <div className="flex justify-center items-center hover:text-yellow-400 transition-colors duration-400">
              <Link to="/service-providing" aria-label="Service Providing">
                <span className="text-2xl font-bold leading-none">S</span>
                {/* "S" symbol */}
              </Link>
            </div>

            <div className=" hover:text-yellow-400 transition-colors duration-400">
              <Link to="/artist-Home/artistprofile" aria-label="Profile">
                <FaUser size={24} />
              </Link>
            </div>
          </nav>
        </footer>
      </div>
    </>
  );
};

export default ArtistBase;
