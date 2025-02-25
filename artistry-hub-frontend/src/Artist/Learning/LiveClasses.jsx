import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateLiveClass from "./CreateLiveClass";
import Modal from "react-modal";
import { format, isBefore, addHours } from "date-fns";
import { Link, useNavigate } from "react-router-dom";

const LiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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

  const isEnrollmentOpen = (finalDate) => {
    const currentDate = new Date();
    const finalEnrollmentDate = new Date(finalDate);

    // Set the final date to end of day (23:59:59)
    finalEnrollmentDate.setHours(23, 59, 59, 999);

    return currentDate <= finalEnrollmentDate;
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (!isEnrollmentOpen(selectedClass.finalEnrollmentDate)) {
      alert("Cannot delete class after enrollment deadline");
      return;
    }

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

      setLiveClasses(liveClasses.filter((c) => c._id !== selectedClass._id));
      setIsDetailsModalOpen(false);
      setSelectedClass(null);
    } catch (error) {
      console.error("Error deleting live class:", error);
      alert(error.response?.data?.message || "Failed to delete live class");
    }
  };

  const handleEdit = async (e) => {
    e.stopPropagation();

    if (!isEnrollmentOpen(selectedClass.finalEnrollmentDate)) {
      alert("Cannot edit class after enrollment deadline");
      return;
    }

    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleStartTestClass = () => {
    navigate("/live-class-room/test-123?role=artist");
  };

  const handleCancelClass = async (classId, dateId) => {
    try {
      // First, find the class date to check the time
      const classToCancel = liveClasses.find((c) => c._id === classId);
      const classDate = classToCancel.classDates.find((d) => d._id === dateId);
      const classDateTime = new Date(classDate.date);
      const now = new Date();

      if (isBefore(classDateTime, addHours(now, 24))) {
        alert(
          "Classes cannot be cancelled less than 24 hours before start time"
        );
        return;
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/live-classes/cancel-class/${classId}/${dateId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Refresh the live classes data
        const updatedClassesResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/live-classes/artist`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLiveClasses(updatedClassesResponse.data);
        alert("Class cancelled successfully");
      }
    } catch (error) {
      console.error("Error cancelling class:", error);
      alert(error.response?.data?.message || "Failed to cancel class");
    }
  };

  const isClassJoinable = (classDate) => {
    const classDateTime = new Date(classDate);
    const now = new Date();
    const diffInMinutes = (classDateTime - now) / (1000 * 60);
    return diffInMinutes <= 15 && diffInMinutes >= -60;
  };

  const renderClassDates = (liveClass) => (
    <div className="mt-4 space-y-2">
      <h3 className="text-yellow-400 font-semibold">Upcoming Classes:</h3>
      {liveClass.classDates
        .filter((cd) => cd.status === "scheduled")
        .map((classDate) => (
          <div
            key={classDate._id}
            className="flex justify-between items-center bg-gray-800 p-2 rounded"
          >
            <span>
              {format(new Date(classDate.date), "MMM dd, yyyy 'at' h:mm a")}
            </span>
            <div className="flex gap-2">
              {isClassJoinable(classDate.date) ? (
                <Link
                  to={`/live-class-room/${liveClass._id}?role=artist`}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Join Class
                </Link>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent modal from opening
                    handleCancelClass(liveClass._id, classDate._id);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  disabled={isBefore(
                    new Date(classDate.date),
                    addHours(new Date(), 24)
                  )}
                >
                  Cancel Class
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );

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
        <div className="flex gap-4">
          <button
            onClick={handleStartTestClass}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full 
            flex items-center gap-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Start Test Class
          </button>
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
          <CreateLiveClass
            closeModal={closeModal}
            quickTips={
              <div className="bg-gray-800/50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-yellow-400 mb-2">
                  Quick Tips:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>Set a reasonable enrollment deadline</li>
                  <li>
                    Course cannot be edited or deleted after enrollment deadline
                  </li>
                  <li>Students cannot enroll or unenroll after the deadline</li>
                  <li>
                    Course will not appear in available courses after deadline
                  </li>
                  <li>
                    Make sure to include all necessary details before the
                    deadline
                  </li>
                  <li>
                    Once the enrollment deadline passes, you cannot modify or
                    remove the course
                  </li>
                  <li>
                    All course content and schedule changes must be made before
                    the deadline
                  </li>
                </ul>
              </div>
            }
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onRequestClose={() => setIsDetailsModalOpen(false)}
        className="modal"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm"
        style={{
          overlay: {
            position: "fixed",
            inset: "0px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            padding: "2rem",
            zIndex: 1000,
          },
          content: {
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            maxWidth: "900px",
            width: "100%",
            margin: "auto",
            padding: "0",
            border: "none",
            borderRadius: "1rem",
            backgroundColor: "#1a1a1a",
            color: "white",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "auto",
            maxHeight: "calc(100vh - 8rem)",
          },
        }}
      >
        {selectedClass && (
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-yellow-400/20 to-transparent z-0" />

            <div
              className="relative z-10 p-8 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 10rem)" }}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  {selectedClass.className}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleEdit}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                        ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/10 text-gray-400 cursor-not-allowed"
                    }`}
                    title={
                      isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                        ? "Edit Class"
                        : "Cannot edit after enrollment deadline"
                    }
                    disabled={
                      !isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                    }
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
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        : "bg-gray-500/10 text-gray-400 cursor-not-allowed"
                    }`}
                    title={
                      isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                        ? "Delete Class"
                        : "Cannot delete after enrollment deadline"
                    }
                    disabled={
                      !isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                    }
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

                  <div className="bg-gray-800/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                      Enrolled Students (
                      {selectedClass.enrolledStudents?.length || 0})
                    </h3>
                    {selectedClass.enrolledStudents?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedClass.enrolledStudents.map((student) => (
                          <Link
                            key={student._id}
                            to={`/profile/${student.userName}`}
                            className="flex items-center p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 
                              transition-all duration-300 border border-yellow-500/10 hover:border-yellow-500/30"
                          >
                            <img
                              src={`${import.meta.env.VITE_BACKEND_URL}${
                                student.profilePicture
                              }`}
                              alt={student.userName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/30"
                            />
                            <span className="ml-3 text-gray-300 hover:text-yellow-400 transition-colors">
                              {student.userName}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">
                        No students enrolled yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <span
                  className={`${
                    isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isEnrollmentOpen(selectedClass.finalEnrollmentDate)
                    ? `Enrollment closes: ${format(
                        new Date(selectedClass.finalEnrollmentDate),
                        "MMM dd, yyyy"
                      )}`
                    : "Enrollment closed - Cannot edit or delete"}
                </span>
              </div>

              {renderClassDates(selectedClass)}
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
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
                    isEnrollmentOpen(liveClass.finalEnrollmentDate)
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {isEnrollmentOpen(liveClass.finalEnrollmentDate)
                    ? "Enrollment Open"
                    : "Enrollment Closed"}
                </div>
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
                <div className="mt-4 text-sm">
                  <span
                    className={`${
                      isEnrollmentOpen(liveClass.finalEnrollmentDate)
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {isEnrollmentOpen(liveClass.finalEnrollmentDate)
                      ? `Enrollment closes: ${format(
                          new Date(liveClass.finalEnrollmentDate),
                          "MMM dd, yyyy"
                        )}`
                      : "Enrollment closed - Cannot edit or delete"}
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
