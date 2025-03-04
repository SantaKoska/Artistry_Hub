import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

//login api and managing token and role based navigation
const loginUser = async (credentials, navigate) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
      credentials
    );

    const { role, token } = response.data;

    localStorage.setItem("token", token);
    // console.log("token:", token);
    localStorage.setItem("role", role);

    toast.success("Login is Successful", {
      position: "top-center",
      autoClose: 3000,
    });

    switch (role) {
      case "Artist":
        navigate("/artist-Home");
        break;

      case "Viewer/Student":
        navigate("/viewer-student-home");
        break;

      case "Service Provider":
        navigate("/Service-Provider-home");
        break;

      case "Institution":
        navigate("/Institution-home");
        break;

      default:
        throw new Error("Invalid role");
    }
  } catch (error) {
    toast.error(
      `Error logging in: ${error.response?.data?.err || "An error occurred"}`,
      {
        position: "top-center",
        autoClose: 3000,
      }
    );
    throw error;
  }
};

// Function for face ID login
const loginWithFaceID = async (email, faceDescriptor, navigate) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login/faceid`,
      { email, faceDescriptor }
    );

    const { role, token } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    toast.success("Face ID Login Successful", {
      position: "top-center",
      autoClose: 3000,
    });

    switch (role) {
      case "Artist":
        navigate("/artist-Home");
        break;

      case "Viewer/Student":
        navigate("/viewer-student-home");
        break;

      case "Service Provider":
        navigate("/Service-Provider-home");
        break;

      case "Institution":
        navigate("/Institution-home");
        break;

      default:
        throw new Error("Invalid role");
    }
  } catch (error) {
    toast.error(
      `Error logging in with Face ID: ${
        error.response?.data?.err || "An error occurred"
      }`,
      {
        position: "top-center",
        autoClose: 3000,
      }
    );
    throw error;
  }
};

export { loginUser, loginWithFaceID };
