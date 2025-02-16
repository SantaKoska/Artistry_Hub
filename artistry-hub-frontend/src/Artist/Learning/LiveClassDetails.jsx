import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaVideo,
  FaUsers,
  FaClock,
  FaMoneyBillWave,
} from "react-icons/fa";
import LiveClassSession from "./LiveClassSession";
import StudentsList from "./LiveClassStudents";

const LiveClassDetails = ({ liveClass, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/${
          liveClass._id
        }/sessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/start-session/${
          liveClass._id
        }`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSessions([...sessions, response.data]);
    } catch (error) {
      console.error("Error starting session:", error);
      alert(error.response?.data?.message || "Error starting session");
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-yellow-400 hover:text-yellow-300 mr-4"
        >
          <FaArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-yellow-400">
          {liveClass.className}
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {["overview", "sessions", "students"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 mr-4 ${
              activeTab === tab
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center text-yellow-400 mb-2">
                <FaClock className="mr-2" />
                <h3 className="font-semibold">Schedule</h3>
              </div>
              <div className="text-gray-300">
                <p>Classes per week: {liveClass.schedule.classesPerWeek}</p>
                <p>Days: {liveClass.schedule.classDays.join(", ")}</p>
                <p>
                  Time: {liveClass.schedule.startTime} -{" "}
                  {liveClass.schedule.endTime}
                </p>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center text-yellow-400 mb-2">
                <FaUsers className="mr-2" />
                <h3 className="font-semibold">Enrollment</h3>
              </div>
              <div className="text-gray-300">
                <p>
                  Students: {liveClass.enrolledStudents.length}/
                  {liveClass.maxStudents}
                </p>
                <p>
                  Deadline:{" "}
                  {new Date(liveClass.enrollmentDeadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center text-yellow-400 mb-2">
                <FaMoneyBillWave className="mr-2" />
                <h3 className="font-semibold">Fees</h3>
              </div>
              <div className="text-gray-300">
                <p>Monthly Fee: ₹{liveClass.monthlyFee}</p>
                <p>
                  Total Earnings: ₹
                  {liveClass.enrolledStudents.length * liveClass.monthlyFee}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">
              Class Details
            </h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-300">Art Form: {liveClass.artForm}</p>
              <p className="text-gray-300">
                Specialization: {liveClass.specialization}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-yellow-400">
              Class Sessions
            </h3>
            <button
              onClick={startNewSession}
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              <FaVideo className="inline mr-2" />
              Start New Session
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <LiveClassSession
                  key={session._id}
                  session={session}
                  onUpdate={fetchSessions}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "students" && (
        <StudentsList
          students={liveClass.enrolledStudents}
          classId={liveClass._id}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default LiveClassDetails;
