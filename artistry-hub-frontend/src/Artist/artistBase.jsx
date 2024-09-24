import {
  FaHome,
  FaEnvelope,
  FaBook,
  FaPlus,
  FaBriefcase,
  FaUser,
} from "react-icons/fa";
import { Outlet, Link } from "react-router-dom";
import Logo from "../assets/LOGO.png";

const ArtistBase = () => {
  return (
    <>
      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed top-0 w-full z-50">
        <header>
          <div className="flex justify-center py-1">
            <img src={Logo} alt="logo" className="w-12 h-12" />
          </div>
        </header>
      </div>

      <div className="pt-24 pb-16">
        <main>
          <Outlet />
        </main>
      </div>

      <div className="bg-slate-800 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 fixed bottom-0 w-full z-50">
        <footer>
          <nav className="flex justify-around p-2 text-white">
            {[
              { to: "/artist-Home", icon: <FaHome size={20} /> },
              // { to: "/messages", icon: <FaEnvelope size={20} /> },
              { to: "/artist-Home/my-courses", icon: <FaBook size={20} /> },
              { to: "/artist-Home/createpost", icon: <FaPlus size={20} /> },
              // { to: "/job-finding", icon: <FaBriefcase size={20} /> },
              {
                to: "/service-providing",
                icon: <span className="text-xl font-bold leading-none">S</span>,
              },
              { to: "/artist-Home/artistprofile", icon: <FaUser size={20} /> },
            ].map(({ to, icon }, index) => (
              <div
                key={index}
                className="hover:text-yellow-400 transition-colors duration-300"
              >
                <Link to={to} aria-label={to}>
                  {icon}
                </Link>
              </div>
            ))}
          </nav>
        </footer>
      </div>
    </>
  );
};

export default ArtistBase;
