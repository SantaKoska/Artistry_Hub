import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { format } from "date-fns";

const LiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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
      setMessage(
        "Successfully enrolled! Check your dashboard for class details."
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error enrolling in live class:", error);
      setMessage("Failed to enroll. Please try again later.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Live Classes
          </h1>
          <p className="text-gray-400 mt-2">
            Explore and enroll in upcoming live sessions
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-center transform transition-all duration-500 ${
            message.includes("Successfully")
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <Modal
        isOpen={isDetailsModalOpen}
        onRequestClose={() => setIsDetailsModalOpen(false)}
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm"
        style={{
          content: {
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            maxWidth: "900px",
            width: "100%",
            padding: "0",
            border: "none",
            borderRadius: "1rem",
            backgroundColor: "#1a1a1a",
            color: "white",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        {selectedClass && (
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-yellow-400/20 to-transparent z-0" />

            <div className="relative z-10 p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {selectedClass.className}
                </h2>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <video
                      className="w-full aspect-video object-cover"
                      controls
                      src={`${import.meta.env.VITE_BACKEND_URL}${
                        selectedClass.trailerVideo
                      }`}
                    />
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${
                        selectedClass.coverPhoto
                      }`}
                      alt={selectedClass.className}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-800/50 rounded-xl p-6">
                    <p className="text-gray-300 leading-relaxed">
                      {selectedClass.description}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem
                        label="Art Form"
                        value={selectedClass.artForm}
                      />
                      <InfoItem
                        label="Specialization"
                        value={selectedClass.specialization}
                      />
                      <InfoItem
                        label="Classes per Week"
                        value={selectedClass.numberOfClassesPerWeek}
                      />
                      <InfoItem
                        label="Class Days"
                        value={selectedClass.classDays.join(", ")}
                      />
                      <InfoItem
                        label="Time"
                        value={`${selectedClass.startTime} - ${selectedClass.endTime}`}
                      />
                      <InfoItem
                        label="Final Enrollment"
                        value={format(
                          new Date(selectedClass.finalEnrollmentDate),
                          "MMM dd, yyyy"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnroll(selectedClass._id)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 
                    hover:to-orange-600 text-black font-semibold py-3 px-6 rounded-xl transform hover:scale-105 
                    transition-all duration-200 shadow-lg"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : liveClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {liveClasses.map((liveClass) => (
            <div
              key={liveClass._id}
              onClick={() => {
                setSelectedClass(liveClass);
                setIsDetailsModalOpen(true);
              }}
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-lg hover:shadow-2xl 
              transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group"
            >
              <div className="relative">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    liveClass.coverPhoto
                  }`}
                  alt={liveClass.className}
                  className="w-full h-56 object-cover rounded-t-xl group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                  {liveClass.artForm}
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-3">
                  {liveClass.className}
                </h2>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {liveClass.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-gray-400">{`${liveClass.numberOfClassesPerWeek} classes/week`}</span>
                  </div>
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-yellow-400">
                    View Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl">
          <div className="bg-gray-700 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">
            No Live Classes Available
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Check back later for new and exciting live classes!
          </p>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-sm text-yellow-400/80">{label}</span>
    <p className="text-white font-medium">{value}</p>
  </div>
);

export default LiveClasses;
