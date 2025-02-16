import React, { useState, useEffect } from "react";
import AddCourse from "./AddCourse";
import EditCourse from "./EditCourse";
import CourseDetails from "./CourseDetails";
import axios from "axios";
import { BiEdit, BiTrash } from "react-icons/bi";
import Dashboard from "./Dashboard";
import LiveClasses from "./LiveClasses";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedArtForm, setSelectedArtForm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const token = localStorage.getItem("token");
  const [activeSection, setActiveSection] = useState("myCourses");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

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

  const handleCourseClick = (course) => {
    setSelectedCourse(course); // Set the selected course to display details
    setActiveSection("courseDetails"); // Change section to courseDetails
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

  useEffect(() => {
    const fetchArtForms = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/art-forms`
        );
        setArtForms(response.data);
      } catch (error) {
        console.error("Error fetching art forms:", error);
      }
    };

    fetchArtForms();
  }, []);

  useEffect(() => {
    const fetchSpecializations = async () => {
      if (selectedArtForm) {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/artist/art-forms/${selectedArtForm}`
          );
          setSpecializations(response.data.specializations);
        } catch (error) {
          console.error("Error fetching specializations:", error);
        }
      } else {
        setSpecializations([]);
      }
    };

    fetchSpecializations();
  }, [selectedArtForm]);

  const filteredCourses = Array.isArray(courses)
    ? courses.filter((course) => {
        const matchesName = course.courseName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel
          ? course.level === selectedLevel
          : true;
        const matchesArtForm = selectedArtForm
          ? course.artForm === selectedArtForm
          : true;
        const matchesSpecialization = selectedSpecialization
          ? course.specialization === selectedSpecialization
          : true;
        return (
          matchesName && matchesLevel && matchesArtForm && matchesSpecialization
        );
      })
    : [];

  return (
    <div className="bg-black text-white rounded-md p-4 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 max-w-screen-xl w-full mx-auto">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
        <ul className="flex justify-around">
          <li>
            <button
              onClick={() => setActiveSection("myCourses")}
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
              onClick={() => setActiveSection("liveClasses")}
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
              onClick={() => setActiveSection("addCourse")}
              className={`text-lg font-semibold ${
                activeSection === "addCourse"
                  ? "text-yellow-400"
                  : "text-gray-300 hover:text-yellow-500"
              }`}
            >
              Add Course
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`text-lg font-semibold ${
                activeSection === "dashboard"
                  ? "text-yellow-400"
                  : "text-gray-300 hover:text-yellow-500"
              }`}
            >
              Dashboard
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Dashboard Content */}
      <div className="bg-gray-800 rounded-md p-4 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "myCourses" && (
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              My Courses
            </h1>
            {/* Search and Filter Section */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by course name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 rounded-md text-black"
              />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="p-2 rounded-md ml-2 text-black"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Professional">Professional</option>
              </select>
              <select
                value={selectedArtForm}
                onChange={(e) => setSelectedArtForm(e.target.value)}
                className="p-2 rounded-md ml-2 text-black"
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
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="p-2 rounded-md ml-2 text-black"
              >
                <option value="">All Specializations</option>
                {specializations.map((specialization) => (
                  <option key={specialization} value={specialization}>
                    {specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Display filtered courses */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course._id}
                    className="bg-gray-700 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                    onClick={() => handleCourseClick(course)}
                  >
                    <h2 className="text-lg font-bold text-yellow-500 mb-2">
                      {course.courseName}
                    </h2>
                    <p className="text-gray-300 mb-2">Level: {course.level}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 mt-4">
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

        {activeSection === "courseDetails" && selectedCourse && (
          <div>
            <CourseDetails
              courseId={selectedCourse._id}
              setActiveSection={setActiveSection}
              setSelectedCourse={setSelectedCourse}
            />
          </div>
        )}

        {activeSection === "liveClasses" && <LiveClasses />}
      </div>
    </div>
  );
};

export default MyCourses;
