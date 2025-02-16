import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaVideo,
  FaUsers,
  FaClock,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import LiveClassDetails from "./LiveClassDetails";

const LiveClasses = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    artForm: "",
    maxFee: "",
    daysOfWeek: [],
    classesPerWeek: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (activeTab === "available") {
      fetchFilteredClasses();
    } else {
      fetchEnrolledClasses();
    }
  }, [activeTab, filters]);

  const fetchFilteredClasses = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        ...(filters.artForm && { artForm: filters.artForm }),
        ...(filters.maxFee && { maxFee: filters.maxFee }),
        ...(filters.daysOfWeek.length > 0 && {
          daysOfWeek: filters.daysOfWeek.join(","),
        }),
        ...(filters.classesPerWeek && {
          classesPerWeek: filters.classesPerWeek,
        }),
      });

      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/live-classes/search-classes?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableClasses(response.data);
    } catch (error) {
      console.error("Error fetching filtered classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledClasses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/enrolled-classes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEnrolledClasses(response.data);
    } catch (error) {
      console.error("Error fetching enrolled classes:", error);
      setEnrolledClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Add search and filter components
  const FilterSection = () => (
    <div className="bg-gray-700 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-gray-300 mb-2">Art Form</label>
          <select
            value={filters.artForm}
            onChange={(e) =>
              setFilters({ ...filters, artForm: e.target.value })
            }
            className="w-full bg-gray-600 text-white rounded px-3 py-2"
          >
            <option value="">All Art Forms</option>
            {["Painting", "Music", "Dance", "Theater", "Literature"].map(
              (form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Maximum Monthly Fee
          </label>
          <input
            type="number"
            value={filters.maxFee}
            onChange={(e) => setFilters({ ...filters, maxFee: e.target.value })}
            className="w-full bg-gray-600 text-white rounded px-3 py-2"
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Classes per Week</label>
          <select
            value={filters.classesPerWeek}
            onChange={(e) =>
              setFilters({ ...filters, classesPerWeek: e.target.value })
            }
            className="w-full bg-gray-600 text-white rounded px-3 py-2"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Preferred Days</label>
          <div className="flex flex-wrap gap-2">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <button
                key={day}
                onClick={() => {
                  const newDays = filters.daysOfWeek.includes(day)
                    ? filters.daysOfWeek.filter((d) => d !== day)
                    : [...filters.daysOfWeek, day];
                  setFilters({ ...filters, daysOfWeek: newDays });
                }}
                className={`px-2 py-1 rounded ${
                  filters.daysOfWeek.includes(day)
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (selectedClass) {
    return (
      <LiveClassDetails
        liveClass={selectedClass}
        onBack={() => {
          setSelectedClass(null);
          fetchFilteredClasses();
        }}
      />
    );
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      {activeTab === "available" && (
        <>
          <div className="flex items-center mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchFilteredClasses()}
                placeholder="Search classes..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 pl-10"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-4 bg-gray-700 p-2 rounded-lg"
            >
              <FaFilter
                className={`${
                  showFilters ? "text-yellow-400" : "text-gray-400"
                }`}
              />
            </button>
          </div>
          {showFilters && <FilterSection />}
        </>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "available"
              ? "bg-yellow-500 text-black"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Available Classes
        </button>
        <button
          onClick={() => setActiveTab("enrolled")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "enrolled"
              ? "bg-yellow-500 text-black"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          My Live Classes
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : (
        <div>
          {(activeTab === "available" ? availableClasses : enrolledClasses)
            .length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {activeTab === "available"
                ? "No available classes at the moment. Please check back later."
                : "You haven't enrolled in any classes yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === "available"
                ? availableClasses
                : enrolledClasses
              ).map((liveClass) => (
                <div
                  key={liveClass._id}
                  onClick={() => setSelectedClass(liveClass)}
                  className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  {liveClass.coverPhotoUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 h-48">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${
                          liveClass.coverPhotoUrl
                        }`}
                        alt={liveClass.className}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-yellow-400">
                      {liveClass.className}
                    </h3>
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm">
                      {liveClass.artForm}
                    </span>
                  </div>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-center">
                      <FaUsers className="text-yellow-400 mr-2" />
                      <span>
                        {liveClass.enrolledStudents.length}/
                        {liveClass.maxStudents} students
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaClock className="text-yellow-400 mr-2" />
                      <span>
                        {liveClass.schedule.startTime} -{" "}
                        {liveClass.schedule.endTime}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaVideo className="text-yellow-400 mr-2" />
                      <span>
                        {liveClass.schedule.classesPerWeek} classes/week
                      </span>
                    </div>

                    <div className="flex items-center">
                      <FaMoneyBillWave className="text-yellow-400 mr-2" />
                      <span>₹{liveClass.monthlyFee}/month</span>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <span className="text-yellow-400">Class Days: </span>
                    {liveClass.schedule.classDays.join(", ")}
                  </div>

                  {activeTab === "available" && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClass(liveClass);
                        }}
                        className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveClasses;
