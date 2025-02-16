import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaVideo, FaUsers, FaClock } from "react-icons/fa";
import CreateLiveClass from "./CreateLiveClass";
import LiveClassDetails from "./LiveClassDetails";

const LiveClasses = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/artist-classes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLiveClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching live classes:", error);
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchLiveClasses();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <LiveClassDetails
        liveClass={selectedClass}
        onBack={() => setSelectedClass(null)}
        onUpdate={fetchLiveClasses}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">Live Classes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          <FaPlus /> Create New Class
        </button>
      </div>

      {liveClasses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 mb-4">No live classes created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Create your first live class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveClasses.map((liveClass) => (
            <div
              key={liveClass._id}
              onClick={() => setSelectedClass(liveClass)}
              className="bg-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-600 transition-colors"
            >
              {liveClass.coverPhotoUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-gray-600 h-48">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${
                      liveClass.coverPhotoUrl
                    }`}
                    alt={liveClass.className}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                {liveClass.className}
              </h3>

              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <FaVideo className="text-yellow-400" />
                  <span>{liveClass.schedule.classesPerWeek} classes/week</span>
                </div>

                <div className="flex items-center gap-2">
                  <FaClock className="text-yellow-400" />
                  <span>
                    {liveClass.schedule.startTime} -{" "}
                    {liveClass.schedule.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FaUsers className="text-yellow-400" />
                  <span>
                    {liveClass.enrolledStudents.length}/{liveClass.maxStudents}{" "}
                    students
                  </span>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <span className="text-yellow-400">Next class:</span>{" "}
                {getNextClassDate(liveClass.schedule.classDays)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateLiveClass
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

const getNextClassDate = (classDays) => {
  const today = new Date();
  const dayIndex = today.getDay();
  const daysMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const nextDays = classDays
    .map((day) => daysMap[day])
    .filter((day) => day > dayIndex)
    .sort();

  if (nextDays.length === 0) {
    // If no days left this week, get the first day of next week
    const firstDay = Math.min(...classDays.map((day) => daysMap[day]));
    const daysUntilNext = 7 - dayIndex + firstDay;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    return nextDate.toLocaleDateString();
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + (nextDays[0] - dayIndex));
  return nextDate.toLocaleDateString();
};

export default LiveClasses;
