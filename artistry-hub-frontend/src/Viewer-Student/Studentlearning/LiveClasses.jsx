import React, { useEffect, useState } from "react";
import axios from "axios";

const LiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLiveClasses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/live-classes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLiveClasses(response.data);
      } catch (error) {
        console.error("Error fetching live classes:", error);
        setMessage("Error fetching live classes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveClasses();
  }, [token]);

  const handleEnroll = async (liveClassId) => {
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/live-classes/enroll/${liveClassId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Successfully enrolled in the live class!");
    } catch (error) {
      console.error("Error enrolling in live class:", error);
      alert("Failed to enroll in the live class.");
    }
  };

  return (
    <div className="bg-black text-white rounded-md p-4 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">Live Classes</h1>
      {loading ? (
        <p className="text-center text-gray-500">Loading live classes...</p>
      ) : message ? (
        <p className="text-center text-red-500">{message}</p>
      ) : liveClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveClasses.map((liveClass) => (
            <div
              key={liveClass._id}
              className="bg-gray-700 p-4 rounded-lg shadow-lg"
            >
              <h2 className="text-lg font-bold text-yellow-500 mb-2">
                {liveClass.className}
              </h2>
              <p className="text-gray-300 mb-2">{liveClass.description}</p>
              <p className="text-gray-300 mb-2">
                Duration: {liveClass.duration} hours
              </p>
              <p className="text-gray-300 mb-2">
                Start Date: {new Date(liveClass.startDate).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleEnroll(liveClass._id)}
                className="mt-2 bg-yellow-500 text-black py-1 px-3 rounded hover:bg-yellow-400 transition duration-200"
              >
                Enroll
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">
          No live classes available.
        </p>
      )}
    </div>
  );
};

export default LiveClasses;
