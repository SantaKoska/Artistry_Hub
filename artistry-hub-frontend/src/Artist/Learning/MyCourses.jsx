import React, { useState, useEffect } from "react";
import AddCourse from "./AddCourse";
import EditCourse from "./EditCourse";
import axios from "axios";
import { BiEdit, BiTrash } from "react-icons/bi";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const token = localStorage.getItem("token");
  const [activeSection, setActiveSection] = useState("myCourses");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleEditClick = (course) => {
    setSelectedCourse(course); // Set the selected course for editing
    setActiveSection("editCourse"); // Change section to editCourse
  };
  const handleDeleteClick = async (courseId) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this course?"
      );
      if (!confirmDelete) return;

      // Make API call to delete the course
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/delete-course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the frontend state to remove the deleted course
      setCourses(courses.filter((course) => course._id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/my-courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
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
                onClick={() => setActiveSection("myCourses")}
                className={`text-lg font-semibold text-center block w-full ${
                  activeSection === "myCourses"
                    ? "text-yellow-400"
                    : "text-gray-700 hover:text-emerald-900"
                }`}
              >
                My Courses
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection("addCourse")}
                className={`text-lg font-semibold text-center block w-full ${
                  activeSection === "addCourse"
                    ? "text-yellow-400"
                    : "text-gray-700 hover:text-emerald-900"
                }`}
              >
                Add Course
              </button>
            </li>
          </ul>
        </div>

        {/* Main Dashboard Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
            {activeSection === "myCourses" && (
              <div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                  My Courses
                </h1>
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
                      >
                        <h2 className="text-xl font-bold text-emerald-900 mb-2">
                          {course.courseName}
                        </h2>
                        <p className="text-gray-700 mb-4">
                          Level: {course.level}
                        </p>
                        <div className="flex justify-between items-center">
                          <button
                            className="bg-emerald-900 text-white p-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200"
                            onClick={() => handleEditClick(course)}
                          >
                            <BiEdit className="w-5 h-5" /> {/* Edit icon */}
                          </button>
                          <button
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                            onClick={() => handleDeleteClick(course._id)}
                          >
                            <BiTrash className="w-5 h-5" /> {/* Delete icon */}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No courses available.
                  </p>
                )}
              </div>
            )}

            {activeSection === "addCourse" && (
              <div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                  Add New Course
                </h1>
                <AddCourse />
              </div>
            )}

            {activeSection === "editCourse" && selectedCourse && (
              <div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                  Edit Course: {selectedCourse.courseName}
                </h1>
                <EditCourse selectedCourse={selectedCourse} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
