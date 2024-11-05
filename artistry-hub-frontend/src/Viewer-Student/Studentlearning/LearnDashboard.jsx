import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseDetails from "./CourseDetails"; // Import the CourseDetails component

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState("availableCourses");
  const [activeCourse, setActiveCourse] = useState(null); // Store course details for view
  const token = localStorage.getItem("token");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});

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
    fetchEnrolledCourses();
  }, [token]);

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 max-w-screen-xl w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Sidebar */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-emerald-900 text-2xl font-semibold mb-6 text-center">
            Dashboard
          </h2>
          <ul className="space-y-6">
            <li>
              <button
                onClick={() => {
                  setActiveSection("availableCourses");
                  setActiveCourse(null); // Reset active course when switching section
                }}
                className={`text-lg font-semibold text-center block w-full ${
                  activeSection === "availableCourses"
                    ? "text-yellow-400"
                    : "text-gray-700 hover:text-emerald-900"
                }`}
              >
                Available Courses
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveSection("myCourses");
                  setActiveCourse(null); // Reset active course when switching section
                }}
                className={`text-lg font-semibold text-center block w-full ${
                  activeSection === "myCourses"
                    ? "text-yellow-400"
                    : "text-gray-700 hover:text-emerald-900"
                }`}
              >
                My Courses
              </button>
            </li>
          </ul>
        </div>

        {/* Main Dashboard Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
            {/* Render CourseDetails component when a course is selected */}
            {activeCourse ? (
              <CourseDetails
                course={activeCourse}
                onBack={() => setActiveCourse(null)}
                isEnrolled={enrolledCourses.some(
                  (course) => course._id === activeCourse._id
                )}
                fetchEnrolledCourses={fetchEnrolledCourses} // Pass this function to refresh enrolled courses after enroll/unenroll
              />
            ) : (
              <>
                {activeSection === "availableCourses" && (
                  <div>
                    <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                      Available Courses
                    </h1>
                    {availableCourses.length > 0 ? (
                      availableCourses.map((course, idx) => (
                        <div
                          key={idx}
                          className="mb-8 cursor-pointer hover:bg-slate-700 p-4 rounded-lg transition-all duration-200"
                          onClick={() => setActiveCourse(course)}
                        >
                          <h2 className="text-2xl font-semibold text-emerald-300">
                            {course.courseName}
                          </h2>
                          <p className="text-gray-400">Level: {course.level}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        No available courses at the moment.
                      </p>
                    )}
                  </div>
                )}

                {activeSection === "myCourses" && (
                  <div>
                    <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                      My Courses
                    </h1>
                    {enrolledCourses.length > 0 ? (
                      enrolledCourses.map((course, idx) => (
                        <div
                          key={idx}
                          className="mb-8 cursor-pointer hover:bg-slate-700 p-4 rounded-lg transition-all duration-200"
                          onClick={() => setActiveCourse(course)}
                        >
                          <h2 className="text-2xl font-semibold text-emerald-300">
                            {course.courseName}
                          </h2>
                          <p className="text-gray-400">Level: {course.level}</p>

                          {/* Progress Bar */}
                          <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-400 bg-emerald-800">
                                  Progress: {courseProgress[course._id] || 0}%
                                </span>
                              </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-100">
                              <div
                                style={{
                                  width: `${courseProgress[course._id] || 0}%`,
                                }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-400"
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        You have not enrolled in any courses yet.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
