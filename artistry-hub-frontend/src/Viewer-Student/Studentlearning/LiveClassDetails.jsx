import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaVideo,
  FaUsers,
  FaClock,
  FaMoneyBillWave,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-toastify";

const LiveClassDetails = ({ liveClass, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const token = localStorage.getItem("token");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkEnrollmentStatus();
    if (isEnrolled) {
      fetchSessions();
    }
  }, [isEnrolled]);

  const checkEnrollmentStatus = () => {
    const enrolled = liveClass.enrolledStudents.some(
      (student) => student.studentId === localStorage.getItem("userId")
    );
    setIsEnrolled(enrolled);
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/${
          liveClass._id
        }/student-sessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      // Check if enrollment deadline has passed
      const deadlineDate = new Date(liveClass.enrollmentDeadline);
      deadlineDate.setHours(23, 59, 59, 999); // Set to end of the day

      if (new Date() > deadlineDate) {
        throw new Error("Enrollment deadline has passed");
      }

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/enroll/${
          liveClass._id
        }`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Successfully enrolled in the class!");
      setIsEnrolled(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error enrolling in class"
      );
    } finally {
      setLoading(false);
    }
  };

  const joinSession = (sessionUrl) => {
    window.open(sessionUrl, "_blank");
  };

  useEffect(() => {
    if (isEnrolled) {
      // Poll for active session every 30 seconds
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/live-classes/active-session/${
              liveClass._id
            }`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data && response.data.status === "ongoing") {
            setSessions((prev) => {
              const exists = prev.some((s) => s._id === response.data._id);
              if (!exists) {
                return [...prev, response.data];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error("Error checking active session:", error);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isEnrolled, liveClass._id]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <h3 className="font-semibold">Class Details</h3>
          </div>
          <div className="text-gray-300">
            <p>Art Form: {liveClass.artForm}</p>
            <p>Specialization: {liveClass.specialization}</p>
            <p>
              Students: {liveClass.enrolledStudents.length}/
              {liveClass.maxStudents}
            </p>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center text-yellow-400 mb-2">
            <FaMoneyBillWave className="mr-2" />
            <h3 className="font-semibold">Payment</h3>
          </div>
          <div className="text-gray-300">
            <p>Monthly Fee: ₹{liveClass.monthlyFee}</p>
            <p>
              Next Payment:{" "}
              {isEnrolled
                ? (() => {
                    const enrolledStudent = liveClass.enrolledStudents.find(
                      (student) =>
                        student.studentId === localStorage.getItem("userId")
                    );
                    return enrolledStudent?.nextPaymentDue
                      ? new Date(
                          enrolledStudent.nextPaymentDue
                        ).toLocaleDateString()
                      : "N/A";
                  })()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {isEnrolled ? (
        <div>
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">
            Upcoming Sessions
          </h3>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session._id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FaVideo className="text-yellow-400 mr-2" />
                    <span className="text-gray-300">
                      {new Date(session.startTime).toLocaleString()}
                    </span>
                  </div>
                  {session.status === "ongoing" && (
                    <button
                      onClick={() => joinSession(session.joinUrl)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Join Live Class
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleEnroll}
            disabled={loading}
            className={`bg-yellow-500 text-black px-8 py-3 rounded-lg ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-400"
            }`}
          >
            {loading ? "Enrolling..." : "Enroll Now"}
          </button>
          <p className="text-gray-400 mt-2">
            Enrollment deadline:{" "}
            {new Date(liveClass.enrollmentDeadline).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveClassDetails;
