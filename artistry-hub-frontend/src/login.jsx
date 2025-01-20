import { Link, useNavigate } from "react-router-dom";
import Logo from "./assets/LOGO.png";
import { useState } from "react";
import loginUser from "./api/loginapi";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const changeHandle = async (e) => {
    const { name, value } = e.target;
    setCredentials((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(credentials, navigate);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="bg-black text-white rounded-lg shadow-lg p-10 w-96">
      <div className="flex justify-center mb-6">
        <img src={Logo} alt="logo" className="w-32 h-auto" />
      </div>
      <h1 className="text-4xl font-bold text-center mb-6 text-yellow-500">
        Login
      </h1>
      <form onSubmit={handleLoginSubmit}>
        <div className="relative my-4">
          <input
            type="email"
            name="email"
            className="block w-full py-3 px-4 text-base text-black border border-yellow-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Your Email"
            onChange={changeHandle}
            required
          />
        </div>

        <div className="relative my-4">
          <input
            type="password"
            name="password"
            className="block w-full py-3 px-4 text-base text-black border border-yellow-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Your Password"
            onChange={changeHandle}
            required
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <Link
            className="text-yellow-500 hover:underline"
            to="/login/forgotpassword"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="w-full mb-4 text-lg font-semibold rounded bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-colors duration-300"
          type="submit"
        >
          Login
        </button>

        <div className="text-center">
          <span className="text-white">
            New Here?{" "}
            <Link className="text-yellow-500 hover:underline" to="/register">
              Create an Account
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
