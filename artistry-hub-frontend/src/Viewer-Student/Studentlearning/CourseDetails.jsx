import React, { useState, useEffect } from "react";
import axios from "axios";
import LessonDetails from "./LessonsDetails"; // Import LessonDetails component

const CourseDetails = ({
  course,
  onBack,
  isEnrolled,
  fetchEnrolledCourses,
  enrolledCourseDetails, // To get details about ticked lessons and chapters
}) => {
  const [selectedLesson, setSelectedLesson] = useState(null); // Manage selected lesson
  const [selectedChapterId, setSelectedChapterId] = useState(null); // Track selected chapter ID
  const [isProcessing, setIsProcessing] = useState(false); // Manage API call status
  const [isCertificateReady, setIsCertificateReady] = useState(false); // To track if the course is fully completed
  const [hasGeneratedCertificate, setHasGeneratedCertificate] = useState(false); // Track if a certificate has been generated
  const token = localStorage.getItem("token");

  if (!course) return null; // If no course is passed, render nothing

  // Check completion status
  const checkCompletionStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/student/check-completion/${course._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { isCompleted } = response.data; // Assuming API returns this field
      setIsCertificateReady(isCompleted);
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
        `http://localhost:8000/student/enroll/${course._id}`,
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
        `http://localhost:8000/student/unenroll/${course._id}`,
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
      const name = hasGeneratedCertificate
        ? enrolledCourseDetails.certificateName
        : prompt("Enter your name for the certificate:");
      if (!name) return; // Cancel if no name provided
      const response = await axios.post(
        `http://localhost:8000/student/generate-certificate/${course._id}`,
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
      setHasGeneratedCertificate(true); // Mark certificate as generated
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
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">
        {course.courseName}
      </h1>
      <p className="text-xl text-gray-400 mb-4">Level: {course.level}</p>

      {/* Enroll or Unenroll button based on the enrolled status */}
      {!isEnrolled ? (
        <button
          className="bg-emerald-900 text-white p-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200"
          onClick={handleEnroll}
          disabled={isProcessing}
        >
          {isProcessing ? "Enrolling..." : "Enroll"}
        </button>
      ) : isCertificateReady ? (
        <button
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors duration-200"
          onClick={handleGenerateCertificate}
        >
          Generate Certificate
        </button>
      ) : (
        <button
          className="bg-red-700 text-white p-2 rounded-lg hover:bg-red-800 transition-colors duration-200"
          onClick={handleUnenroll}
          disabled={isProcessing}
        >
          {isProcessing ? "Unenrolling..." : "Unenroll"}
        </button>
      )}

      <h2 className="text-3xl font-bold text-emerald-300 mt-6">Chapters</h2>
      {course.chapters.length > 0 ? (
        course.chapters.map((chapter, idx) => (
          <div key={idx} className="my-4">
            <h3 className="text-2xl font-semibold text-emerald-500">
              Chapter {idx + 1}: {chapter.title}{" "}
              {enrolledCourseDetails?.tickedChapters?.includes(chapter._id) && (
                <span className="text-green-500">✔</span>
              )}
            </h3>
            <p className="text-gray-400 mb-2">{chapter.description}</p>

            <ul className="list-disc pl-5">
              {chapter.lessons.map((lesson, lessonIdx) => (
                <li
                  key={lessonIdx}
                  className={`text-lg ${
                    isEnrolled
                      ? "text-emerald-400 cursor-pointer hover:text-emerald-300"
                      : "text-gray-500"
                  }`}
                  onClick={() => {
                    if (isEnrolled) {
                      setSelectedLesson(lesson); // Set the selected lesson
                      setSelectedChapterId(chapter._id); // Set the selected chapter ID
                    }
                  }}
                >
                  {lesson.title}{" "}
                  {enrolledCourseDetails?.tickedLessons?.includes(
                    lesson._id
                  ) && <span className="text-green-500">✔</span>}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No chapters available.</p>
      )}
    </div>
  );
};

export default CourseDetails;
