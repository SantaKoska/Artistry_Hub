import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseDetails from "./CourseDetails"; // Import the CourseDetails component
import StudentDashboard from "./StudentDashboard"; // Import the StudentDashboard component
import { FaSearch } from "react-icons/fa"; // Importing a search icon
import LiveClasses from "./LiveClassesStudent"; // Import the LiveClasses component

const LearnDashboard = () => {
  const [activeSection, setActiveSection] = useState("availableCourses");
  const [activeCourse, setActiveCourse] = useState(null); // Store course details for view
  const token = localStorage.getItem("token");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [levels, setLevels] = useState([]); // State for levels
  const [selectedArtForm, setSelectedArtForm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(""); // State for selected level
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [showDashboard, setShowDashboard] = useState(false); // State to toggle dashboard visibility
  // console.log(enrolledCourses);
  // Fetch Available Courses
  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/student/available-courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableCourses(response.data);
    } catch (error) {
      console.error("Error fetching available courses:", error);
    }
  };

  // Fetch Art Forms
  const fetchArtForms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/student/art-forms`
      );
      setArtForms(response.data);
    } catch (error) {
      console.error("Error fetching art forms:", error);
    }
  };

  // Fetch Specializations
  const fetchSpecializations = async () => {
    if (selectedArtForm) {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/student/specializations?artForm=${selectedArtForm}`
        );
        setSpecializations(response.data);
      } catch (error) {
        console.error("Error fetching specializations:", error);
      }
    } else {
      setSpecializations([]);
    }
  };

  // Fetch Levels (Assuming levels are predefined)
  const fetchLevels = () => {
    // Example levels, you can modify this as needed
    const predefinedLevels = ["Beginner", "Intermediate", "Advanced"];
    setLevels(predefinedLevels);
  };

  // Fetch Enrolled Courses and their progress
  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/student/my-courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEnrolledCourses(response.data);

      // Fetch progress for each enrolled course
      response.data.forEach(async (course) => {
        const progressRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/student/check-completion/${
            course._id
          }`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCourseProgress((prevProgress) => ({
          ...prevProgress,
          [course._id]: progressRes.data.isCompleted
            ? 100
            : calculateProgress(course, progressRes.data.enrolledCourse),
        }));
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    }
  };

  // Calculate progress percentage based on ticked lessons and chapters
  const calculateProgress = (course, enrolledCourse) => {
    const totalLessons = course.chapters.reduce(
      (sum, chapter) => sum + chapter.lessons.length,
      0
    );
    const completedLessons = enrolledCourse.tickedLessons.length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  // Fetch courses when component mounts
  useEffect(() => {
    fetchAvailableCourses();
    fetchArtForms();
    fetchLevels(); // Fetch levels
    fetchEnrolledCourses();
  }, [token]);

  useEffect(() => {
    fetchSpecializations();
  }, [selectedArtForm]);

  // Filter available courses based on search term, art form, specialization, and level
  const filteredCourses = availableCourses.filter((course) => {
    const matchesName = course.courseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArtForm = selectedArtForm
      ? course.artForm === selectedArtForm
      : true;
    const matchesSpecialization = selectedSpecialization
      ? course.specialization === selectedSpecialization
      : true;
    const matchesLevel = selectedLevel ? course.level === selectedLevel : true; // Check for selected level
    return (
      matchesName && matchesArtForm && matchesSpecialization && matchesLevel
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 p-8">
      <div className="max-w-screen-xl mx-auto">
        {/* Updated Top Navigation Bar */}
        <nav className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
          <ul className="flex justify-around">
            <li>
              <button
                onClick={() => {
                  setActiveSection("availableCourses");
                  setActiveCourse(null);
                }}
                className={`text-lg font-semibold ${
                  activeSection === "availableCourses"
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-500"
                }`}
              >
                Available Courses
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveSection("myCourses");
                  setActiveCourse(null);
                }}
                className={`text-lg font-semibold ${
                  activeSection === "myCourses"
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-500"
                }`}
              >
                My Courses
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveSection("liveClasses");
                  setActiveCourse(null);
                }}
                className={`text-lg font-semibold ${
                  activeSection === "liveClasses"
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-500"
                }`}
              >
                Live Classes
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveSection("analytics");
                  setActiveCourse(null);
                }}
                className={`text-lg font-semibold ${
                  activeSection === "analytics"
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-500"
                }`}
              >
                Analytics
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-zinc-800">
          {activeSection === "analytics" ? (
            <StudentDashboard />
          ) : (
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-zinc-800">
              {activeCourse ? (
                <CourseDetails
                  course={activeCourse}
                  onBack={() => setActiveCourse(null)}
                  isEnrolled={enrolledCourses.some(
                    (course) => course._id === activeCourse._id
                  )}
                  fetchEnrolledCourses={fetchEnrolledCourses}
                />
              ) : (
                <>
                  {activeSection === "availableCourses" && (
                    <div>
                      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
                        Available Courses
                      </h1>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-black bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200"
                          />
                        </div>

                        {/* Filters */}
                        <select
                          value={selectedArtForm}
                          onChange={(e) => setSelectedArtForm(e.target.value)}
                          className="w-full p-3 rounded-lg text-black bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200"
                        >
                          <option value="">Art Form</option>
                          {artForms.map((artForm) => (
                            <option key={artForm} value={artForm}>
                              {artForm}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedSpecialization}
                          onChange={(e) =>
                            setSelectedSpecialization(e.target.value)
                          }
                          className="w-full p-3 rounded-lg text-black bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200"
                        >
                          <option value="">Specialization</option>
                          {specializations.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          className="w-full p-3 rounded-lg text-black bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition duration-200"
                        >
                          <option value="">Level</option>
                          {levels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredCourses.map((course) => (
                          <div
                            key={course._id}
                            onClick={() => setActiveCourse(course)}
                            className="group cursor-pointer bg-zinc-800/50 p-6 rounded-xl transition-all duration-300 border border-zinc-700 hover:border-yellow-400/50 hover:bg-zinc-700/50"
                          >
                            <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400">
                              {course.courseName}
                            </h2>
                            <div className="flex gap-3">
                              <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">
                                {course.level}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-zinc-700/50 text-gray-300 text-sm">
                                {course.artForm}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "myCourses" && (
                    <div>
                      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
                        My Courses
                      </h1>
                      {enrolledCourses.length > 0 ? (
                        enrolledCourses.map((course, idx) => (
                          <div
                            key={idx}
                            className="mb-6 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl transition-all duration-300 border border-zinc-700"
                            onClick={() => setActiveCourse(course)}
                          >
                            <h2 className="text-2xl font-bold text-white mb-2">
                              {course.courseName}
                            </h2>
                            <p className="text-gray-300 mb-4">
                              Level: {course.level}
                            </p>

                            {/* Progress Bar */}
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <span className="text-sm font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-400 bg-yellow-400/10">
                                  Progress: {courseProgress[course._id] || 0}%
                                </span>
                              </div>
                              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-zinc-700">
                                <div
                                  style={{
                                    width: `${
                                      courseProgress[course._id] || 0
                                    }%`,
                                  }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-400 transition-all duration-500 rounded-full"
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">
                          You have not enrolled in any courses yet.
                        </p>
                      )}
                    </div>
                  )}

                  {activeSection === "liveClasses" && <LiveClasses />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnDashboard;
