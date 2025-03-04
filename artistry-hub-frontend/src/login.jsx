import { Link, useNavigate } from "react-router-dom";
import Logo from "./assets/LOGO.png";
import { useState, useEffect, useRef } from "react";
import { loginUser, loginWithFaceID } from "./api/loginapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as faceapi from "face-api.js";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const videoRef = useRef();
  const [isFaceLogin, setIsFaceLogin] = useState(false);

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

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Face detection models loaded successfully");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        toast.error("Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  const startFaceLogin = async () => {
    if (!credentials.email) {
      toast.error("Please enter your email before using Face ID login.");
      return;
    }
    setIsFaceLogin(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error("Unable to access camera");
      console.error(error);
    }
  };

  const captureFaceData = async () => {
    if (!videoRef.current) return;

    try {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        toast.error(
          "No face detected. Please ensure your face is clearly visible."
        );
        return;
      }

      const faceDescriptor = Array.from(detections.descriptor);
      const userId = credentials.email;

      await loginWithFaceID(userId, faceDescriptor, navigate);
    } catch (error) {
      toast.error("Error capturing face data");
      console.error(error);
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

        <button
          className="w-full mb-4 text-lg font-semibold rounded bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-colors duration-300"
          type="button"
          onClick={startFaceLogin}
        >
          Login with Face ID
        </button>

        {isFaceLogin && (
          <div>
            <video ref={videoRef} autoPlay className="w-full h-auto" />
            <button
              onClick={captureFaceData}
              className="mt-4 bg-yellow-500 text-black rounded px-4 py-2"
            >
              Capture Face Data
            </button>
          </div>
        )}

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
