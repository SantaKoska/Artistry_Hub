import React, { useState, useEffect } from "react";
import axios from "axios";
import LessonDetails from "./LessonsDetails"; // Import LessonDetails component

const CourseDetails = ({
  course,
  onBack,
  isEnrolled,
  fetchEnrolledCourses, // To get details about ticked lessons and chapters
}) => {
  const [selectedLesson, setSelectedLesson] = useState(null); // Manage selected lesson
  const [selectedChapterId, setSelectedChapterId] = useState(null); // Track selected chapter ID
  const [isProcessing, setIsProcessing] = useState(false); // Manage API call status
  const [isCertificateReady, setIsCertificateReady] = useState(false); // Track if the course is fully completed
  const [enrolledCourseDetails, setEnrolledCourseDetails] = useState(null); // Store enrolled course details
  const token = localStorage.getItem("token");

  if (!course) return null; // If no course is passed, render nothing

  // Check completion status and get enrolled course details
  const checkCompletionStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/student/check-completion/${course._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { isCompleted, enrolledCourse } = response.data; // Get completion status and enrolled course details
      setIsCertificateReady(isCompleted);
      setEnrolledCourseDetails(enrolledCourse); // Store the enrolled course details
    } catch (error) {
      console.error("Error checking completion status:", error);
    }
  };

  useEffect(() => {
    checkCompletionStatus(); // Check completion status on component mount
  }, [course]);

  // Enroll in a course
  const handleEnroll = async () => {
    setIsProcessing(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/student/enroll/${course._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchEnrolledCourses(); // Refresh enrolled courses in parent component
      setIsProcessing(false);
      alert("Enrolled successfully!");
    } catch (error) {
      console.error("Error enrolling in course:", error);
      setIsProcessing(false);
    }
  };

  // Unenroll from a course
  const handleUnenroll = async () => {
    setIsProcessing(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/student/unenroll/${course._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchEnrolledCourses(); // Refresh enrolled courses in parent component
      setIsProcessing(false);
      alert("Unenrolled successfully!");
      onBack(); // Go back to the courses list
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      setIsProcessing(false);
    }
  };

  // Generate certificate
  const handleGenerateCertificate = async () => {
    try {
      const name = enrolledCourseDetails?.certificateName
        ? enrolledCourseDetails.certificateName
        : prompt("Enter your name for the certificate:");
      if (!name) return; // Cancel if no name provided
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/student/generate-certificate/${course._id}`,
        { certificateName: name },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Ensure the response is treated as a blob
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${course.courseName}_Certificate.pdf`; // Filename for the downloaded certificate
      a.click();
      window.URL.revokeObjectURL(url);
      setIsCertificateReady(true); // Mark certificate as generated
    } catch (error) {
      console.error("Error generating certificate:", error);
    }
  };

  // If a lesson is selected, show the LessonDetails component
  if (selectedLesson) {
    return (
      <LessonDetails
        lesson={selectedLesson}
        courseId={course._id} // Passing the course ID
        chapterId={selectedChapterId} // Passing the selected chapter ID
        onBack={() => setSelectedLesson(null)} // Callback to go back to course details
        onComplete={fetchEnrolledCourses} // Refresh course details upon lesson completion
      />
    );
  }

  return (
    <div className="bg-slate-800 rounded-md p-8 shadow-xl backdrop-filter backdrop-blur-md bg-opacity-40 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">
        {course.courseName}
      </h1>
      <p className="text-xl text-gray-300 mb-6">
        Level: <span className="font-semibold">{course.level}</span>
      </p>

      {/* Enroll or Unenroll button based on the enrolled status */}
      <div className="mb-6">
        {!isEnrolled ? (
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-transform transform hover:scale-105 duration-200"
            onClick={handleEnroll}
            disabled={isProcessing}
          >
            {isProcessing ? "Enrolling..." : "Enroll"}
          </button>
        ) : isCertificateReady ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-200"
            onClick={handleGenerateCertificate}
          >
            Generate Certificate
          </button>
        ) : (
          <button
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-transform transform hover:scale-105 duration-200"
            onClick={handleUnenroll}
            disabled={isProcessing}
          >
            {isProcessing ? "Unenrolling..." : "Unenroll"}
          </button>
        )}
      </div>

      <h2 className="text-3xl font-bold text-emerald-300 mt-8 mb-4">
        Chapters
      </h2>

      {course.chapters.length > 0 ? (
        <div className="space-y-6">
          {course.chapters.map((chapter, idx) => (
            <div key={idx} className="p-6 bg-slate-700 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-2xl font-semibold text-emerald-300">
                  Chapter {idx + 1}: {chapter.title}
                </h3>
                {enrolledCourseDetails?.tickedChapters?.includes(
                  chapter._id
                ) && (
                  <span className="text-green-400 font-bold text-lg">
                    ✔ Completed
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-4">{chapter.description}</p>

              <ul className="space-y-3">
                {chapter.lessons.map((lesson, lessonIdx) => (
                  <li
                    key={lessonIdx}
                    className={`text-lg ${
                      isEnrolled
                        ? "text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors"
                        : "text-gray-500"
                    }`}
                    onClick={() => {
                      if (isEnrolled) {
                        setSelectedLesson(lesson); // Set the selected lesson
                        setSelectedChapterId(chapter._id); // Set the selected chapter ID
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{lesson.title}</span>
                      {enrolledCourseDetails?.tickedLessons?.includes(
                        lesson._id
                      ) && (
                        <span className="text-green-400 font-semibold">
                          ✔ Completed
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No chapters available.</p>
      )}
    </div>
  );
};

export default CourseDetails;
