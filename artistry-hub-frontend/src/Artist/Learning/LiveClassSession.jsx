import React, { useState } from "react";
import axios from "axios";
import { FaVideo, FaUsers, FaClock, FaStop } from "react-icons/fa";

const LiveClassSession = ({ session, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const endSession = async () => {
    if (!confirm("Are you sure you want to end this session?")) return;

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/end-session/${
          session._id
        }`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate();
    } catch (error) {
      console.error("Error ending session:", error);
      alert(error.response?.data?.message || "Error ending session");
    } finally {
      setLoading(false);
    }
  };

  const joinSession = () => {
    if (session.joinUrl) {
      window.open(session.joinUrl, "_blank");
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaVideo className="text-yellow-400 mr-2" />
          <span className="text-gray-300">
            {new Date(session.startTime).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className={`px-2 py-1 rounded ${
              session.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : session.status === "ongoing"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
          {session.status === "ongoing" && (
            <button
              onClick={endSession}
              disabled={loading}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              <FaStop className="inline mr-1" />
              End
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="flex items-center">
          <FaUsers className="text-yellow-400 mr-2" />
          <span className="text-gray-300">
            {session.attendees.length} Attendees
          </span>
        </div>

        {session.status === "completed" && (
          <>
            <div className="flex items-center">
              <FaClock className="text-yellow-400 mr-2" />
              <span className="text-gray-300">
                Duration: {formatDuration(session.duration)}
              </span>
            </div>

            {session.recordingUrl && (
              <a
                href={session.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300"
              >
                View Recording
              </a>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center">
        {session.status === "ongoing" && (
          <button
            onClick={joinSession}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Join Session
          </button>
        )}

        {session.status === "ongoing" && (
          <button
            onClick={endSession}
            disabled={loading}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
          >
            <FaStop className="inline mr-1" />
            End
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveClassSession;
