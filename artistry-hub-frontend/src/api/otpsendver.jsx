import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//Sending otp api calling
export const sendOtp = async (email, setOtpSent) => {
  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/sendotp`, {
      email,
    });

    setOtpSent(true);
    toast.success("OTP sent to your email.", {
      position: "top-center",
      autoClose: 3000,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    toast.error("Failed to send OTP. PLease try again.", {
      position: "top-center",
      autoClose: 3000,
    });
  }
};

//
//
//
// verifying otp

export const verifyOtp = async (email, otp, setOtpVerified, setError) => {
  try {
    const response = await axios.post(
      "${process.env.REACT_APP_BACKEND_URL}/auth/verifyotp",
      {
        email,
        otp,
      }
    );

    if (response.status === 200) {
      setOtpVerified(true);
      toast.success("OTP verified successfully.", {
        position: "top-center",
        autoClose: 3000,
      });
    } else {
      setOtpVerified(false);
      setError((prevErrors) => ({
        ...prevErrors,
        otp: response.data.err || "Invalid OTP",
      }));
    }
  } catch (error) {
    console.error(
      "Error verifying OTP:",
      error.response ? error.response.data : error.message
    );
    toast.error(
      error.response
        ? error.response.data.err
        : "Failed to verify OTP. Please try again",
      {
        position: "top-center",
        autoClose: 3000,
      }
    );
  }
};
