import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BiUser } from "react-icons/bi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`,
        { email }
      );
      toast.success("Reset link sent to your email!");
    } catch (err) {
      toast.error(`Error sending reset link : ${err.response?.data?.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
      <div>
        <h1 className="text-4xl font-semibold text-whitefont-bold text-center mb-6">
          Forgot Password
        </h1>
        <form onSubmit={handleForgotPassword}>
          <div className="relative my-4 mb-8">
            <input
              type="email"
              name="email"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <label
              htmlFor="email"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0]  peer-focus:text-yellow-400 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Your Email
            </label>
            <BiUser className="absolute top-0 right-4 peer-focus:dark:text-yellow-500" />
            <button
              className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
