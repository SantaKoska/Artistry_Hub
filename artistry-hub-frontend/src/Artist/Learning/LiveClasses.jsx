import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateLiveClass from "./CreateLiveClass";
import Modal from "react-modal";
import { format } from "date-fns";

const LiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLiveClasses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/live-classes/artist`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLiveClasses(response.data);
      } catch (error) {
        console.error("Error fetching live classes:", error);
      }
    };

    fetchLiveClasses();
  }, [token]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent modal from opening when clicking delete

    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/${selectedClass._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the live classes list
      setLiveClasses(liveClasses.filter((c) => c._id !== selectedClass._id));
      setIsDetailsModalOpen(false);
      setSelectedClass(null);
    } catch (error) {
      console.error("Error deleting live class:", error);
      alert("Failed to delete live class");
    }
  };

  const handleEdit = async (e) => {
    e.stopPropagation(); // Prevent details modal from opening
    setIsEditModalOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Live Classes
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your upcoming live sessions
          </p>
        </div>
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 
          text-black font-semibold py-3 px-6 rounded-full flex items-center gap-2 transform hover:scale-105 
          transition-all duration-200 shadow-lg"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Live Class
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          content: {
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            maxWidth: "600px",
            width: "100%",
            padding: "0",
            border: "none",
            borderRadius: "0.5rem",
            backgroundColor: "#1f2937",
            color: "white",
          },
        }}
      >
        <div className="relative">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          <CreateLiveClass closeModal={closeModal} />
        </div>
      </Modal>

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
                <div className="flex gap-3">
                  <button
                    onClick={handleEdit}
                    className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all duration-300"
                    title="Edit Class"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
                    title="Delete Class"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-2.5 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 transition-all duration-300"
                    title="Close"
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
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          content: {
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            maxWidth: "600px",
            width: "100%",
            padding: "0",
            border: "none",
            borderRadius: "0.5rem",
            backgroundColor: "#1f2937",
            color: "white",
          },
        }}
      >
        <div className="relative">
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          <CreateLiveClass
            closeModal={() => setIsEditModalOpen(false)}
            isEditing={true}
            liveClassData={selectedClass}
          />
        </div>
      </Modal>

      {liveClasses.length > 0 ? (
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
            No Live Classes Yet
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Start creating engaging live classes and connect with your students
            in real-time!
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
