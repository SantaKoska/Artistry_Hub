import { Link, useNavigate } from "react-router-dom";
import Logo from "./assets/LOGO.png";
import { useState, useEffect, useRef } from "react";
import { loginUser, loginWithFaceID, verifyLoginOTP } from "./api/loginapi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as faceapi from "face-api.js";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const videoRef = useRef();
  const [isFaceLogin, setIsFaceLogin] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOTP] = useState("");
  const [tempEmail, setTempEmail] = useState("");

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
      const response = await loginUser(credentials);
      if (response.requireOTP) {
        setTempEmail(response.email);
        setShowOTPModal(true);
        toast.info("Please enter the OTP sent to your email");
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyLoginOTP(tempEmail, otp, navigate);
      setShowOTPModal(false);
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
        videoRef.current.style.display = "none";
        setTimeout(captureFaceData, 500);
      }
    } catch (error) {
      setIsFaceLogin(false); // Stop showing the scanning UI
      toast.error("Unable to access camera");
      console.error(error);
    }
  };

  const captureFaceData = async () => {
    if (!videoRef.current) return;

    try {
      const livenessScore = await detectLiveness(videoRef.current);
      if (livenessScore < 0.6) {
        setIsFaceLogin(false);
        stopVideoStream();
        toast.error(
          "Make sure you're not showing a photo or maybe you're too far or too close to the camera"
        );
        return;
      }

      const detectionPromises = Array(3)
        .fill()
        .map(() =>
          faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor()
        );

      const detections = await Promise.all(detectionPromises);

      if (detections.some((d) => !d)) {
        setIsFaceLogin(false);
        stopVideoStream();
        toast.error(
          "Face detection failed. Please ensure your face is clearly visible and centered."
        );
        return;
      }

      const averageDescriptor = averageDescriptors(
        detections.map((d) => d.descriptor)
      );
      const userId = credentials.email;

      // Stop video stream before attempting login
      stopVideoStream();
      setIsFaceLogin(false);

      // Attempt login with face data
      await loginWithFaceID(userId, Array.from(averageDescriptor), navigate);
    } catch (error) {
      setIsFaceLogin(false);
      stopVideoStream();
      toast.error("Error capturing face data");
      console.error(error);
    }
  };

  // Helper function to detect liveness using facial landmarks movement
  const detectLiveness = async (videoElement) => {
    const startTime = Date.now();
    const landmarks = [];

    // Collect facial landmarks for 2 seconds
    while (Date.now() - startTime < 2000) {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detection) {
        landmarks.push(detection.landmarks.positions);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Analyze landmark movement for liveness
    return analyzeLandmarkMovement(landmarks);
  };

  // Add this function after the detectLiveness function
  const analyzeLandmarkMovement = (landmarks) => {
    if (landmarks.length < 2) return 0; // Not enough samples

    let totalMovement = 0;
    let naturalMovement = 0;

    // Analyze movement between consecutive frames
    for (let i = 1; i < landmarks.length; i++) {
      const prevLandmarks = landmarks[i - 1];
      const currentLandmarks = landmarks[i];

      // Calculate movement for each landmark point
      for (let j = 0; j < prevLandmarks.length; j++) {
        const movement = Math.sqrt(
          Math.pow(currentLandmarks[j].x - prevLandmarks[j].x, 2) +
            Math.pow(currentLandmarks[j].y - prevLandmarks[j].y, 2)
        );

        totalMovement += movement;

        // Check if movement is natural (not too sudden or rigid)
        if (movement > 0.1 && movement < 5) {
          naturalMovement++;
        }
      }
    }

    // Calculate liveness score based on:
    // 1. Presence of movement (not completely still)
    // 2. Natural movement patterns (not too rigid or sudden)
    // 3. Consistency of landmarks detection
    const movementScore = Math.min(totalMovement / (landmarks.length * 68), 1);
    const naturalScore = naturalMovement / (landmarks.length * 68);
    const consistencyScore = landmarks.length / 20; // Assuming 20 samples is ideal

    // Weighted average of scores
    const livenessScore =
      movementScore * 0.3 + naturalScore * 0.4 + consistencyScore * 0.3;

    // Add some console logs for debugging
    console.log("Liveness Analysis:", {
      movementScore,
      naturalScore,
      consistencyScore,
      finalScore: livenessScore,
    });

    return livenessScore;
  };

  // Helper function to average multiple face descriptors
  const averageDescriptors = (descriptors) => {
    const numDescriptors = descriptors.length;
    const numDimensions = descriptors[0].length;
    const average = new Float32Array(numDimensions);

    for (let i = 0; i < numDimensions; i++) {
      average[i] =
        descriptors.reduce((sum, desc) => sum + desc[i], 0) / numDescriptors;
    }

    return average;
  };

  // Add helper function to stop video stream
  const stopVideoStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Clean up video stream when component unmounts
  useEffect(() => {
    return () => {
      stopVideoStream();
    };
  }, []);

  // Add OTP Modal component
  const OTPModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white text-black p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter OTP</h2>
        <form onSubmit={handleOTPSubmit}>
          <input
            type="text"
            className="w-full p-3 border border-yellow-500 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
            autoFocus
            maxLength={6}
            pattern="\d*"
            inputMode="numeric"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-1/2 bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600"
            >
              Verify
            </button>
            <button
              type="button"
              className="w-1/2 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
              onClick={() => setShowOTPModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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

        <div className="flex gap-4 mb-4">
          <button
            className="w-1/2 text-lg font-semibold rounded bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-colors duration-300"
            type="submit"
          >
            Password Login
          </button>

          <button
            className="w-1/2 text-lg font-semibold rounded bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-colors duration-300"
            type="button"
            onClick={startFaceLogin}
          >
            Face ID Login
          </button>
        </div>

        {isFaceLogin && (
          <div className="text-center my-4">
            <div className="mb-4">
              <svg
                className="animate-pulse mx-auto"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 10C9 9.44772 9.44772 9 10 9H14C14.5523 9 15 9.44772 15 10V14C15 14.5523 14.5523 15 14 15H10C9.44772 15 9 14.5523 9 14V10Z"
                  fill="#EAB308"
                />
                <path
                  d="M7 8C7 6.89543 7.89543 6 9 6H15C16.1046 6 17 6.89543 17 8V16C17 17.1046 16.1046 18 15 18H9C7.89543 18 7 17.1046 7 16V8Z"
                  stroke="#EAB308"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <p className="text-yellow-500 text-lg">Looking for your face...</p>
            <video ref={videoRef} autoPlay />
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
      {showOTPModal && <OTPModal />}
    </div>
  );
};

export default Login;
