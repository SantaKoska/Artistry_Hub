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
    <div className="bg-black text-white rounded-md p-4 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 max-w-screen-xl w-full mx-auto">
      {/* Updated Navigation Bar */}
      <nav className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
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

      {/* Updated Main Content Container */}
      <div className="bg-gray-800 rounded-md p-4 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
        {activeSection === "analytics" ? (
          <StudentDashboard />
        ) : (
          <div className="space-y-6">
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
                    <h1 className="text-3xl font-bold text-yellow-400 mb-4">
                      Available Courses
                    </h1>

                    {/* Updated Filter Section */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 rounded-md text-black"
                      />
                      <select
                        value={selectedArtForm}
                        onChange={(e) => setSelectedArtForm(e.target.value)}
                        className="p-2 rounded-md text-black"
                      >
                        <option value="">All Art Forms</option>
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
                        className="p-2 rounded-md text-black"
                      >
                        <option value="">All Specializations</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="p-2 rounded-md text-black"
                      >
                        <option value="">All Levels</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Updated Course Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCourses.map((course) => (
                        <div
                          key={course._id}
                          onClick={() => setActiveCourse(course)}
                          className="bg-gray-700 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                        >
                          <h2 className="text-lg font-bold text-yellow-500 mb-2">
                            {course.courseName}
                          </h2>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-gray-600 rounded-full text-sm">
                              {course.level}
                            </span>
                            <span className="px-2 py-1 bg-gray-600 rounded-full text-sm">
                              {course.artForm}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Updated My Courses Section */}
                {activeSection === "myCourses" && (
                  <div>
                    <h1 className="text-3xl font-bold text-yellow-400 mb-4">
                      My Courses
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrolledCourses.length > 0 ? (
                        enrolledCourses.map((course) => (
                          <div
                            key={course._id}
                            onClick={() => setActiveCourse(course)}
                            className="bg-gray-700 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                          >
                            <h2 className="text-lg font-bold text-yellow-500 mb-2">
                              {course.courseName}
                            </h2>
                            <p className="text-gray-300 mb-2">
                              Progress: {courseProgress[course._id] || 0}%
                            </p>
                            <div className="w-full bg-gray-600 rounded-full h-2.5">
                              <div
                                className="bg-yellow-400 h-2.5 rounded-full"
                                style={{
                                  width: `${courseProgress[course._id] || 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 col-span-3 text-center">
                          You have not enrolled in any courses yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "liveClasses" && <LiveClasses />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnDashboard;
