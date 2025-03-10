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
      // First perform liveness detection
      const livenessScore = await detectLiveness(videoRef.current);
      if (livenessScore < 0.8) {
        // Threshold for liveness detection
        toast.error(
          "Liveness check failed. Please ensure you are a real person , not your photo and try again."
        );
        return;
      }

      // Perform multiple face detections to ensure consistency
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

      // Verify all detections are valid and consistent
      if (detections.some((d) => !d)) {
        toast.error(
          "Face detection failed. Please ensure your face is clearly visible and centered."
        );
        return;
      }

      // Average the descriptors for better accuracy
      const averageDescriptor = averageDescriptors(
        detections.map((d) => d.descriptor)
      );
      const userId = credentials.email;

      await loginWithFaceID(userId, Array.from(averageDescriptor), navigate);
    } catch (error) {
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
