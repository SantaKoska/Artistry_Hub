import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlineUnlock } from "react-icons/ai";
import validator from "validator";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validatePassword = (password) =>
    validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

  const handleResetPassword = async (e) => {
    e.preventDefault();

    //
    //validation
    if (!validatePassword(newPassword)) {
      toast.error(
        "Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 symbol"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axios.post(`http://localhost:8000/auth/reset-password/${token}`, {
        newPassword: newPassword,
      });
      toast.success("Password has been reset!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
      <div>
        <h1 className="text-4xl font-semibold text-whitefont-bold text-center mb-6">
          Reset Password
        </h1>
        <form onSubmit={handleResetPassword}>
          <div className="relative my-4 mb-8">
            <input
              type="password"
              name="password"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <label
              htmlFor="password"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0]  peer-focus:text-yellow-400 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Your Password
            </label>
            <AiOutlineUnlock className="absolute top-0 right-4 peer-focus:dark:text-yellow-500" />
          </div>
          <div className="relative my-4 mb-8">
            <input
              type="password"
              name="confirmpassword"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label
              htmlFor="password"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0]  peer-focus:text-yellow-400 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Confirm Password
            </label>
            <AiOutlineUnlock className="absolute top-0 right-4 peer-focus:dark:text-yellow-500" />
          </div>
          <button
            className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
            type="submit"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
