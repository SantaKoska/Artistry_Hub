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
        `${import.meta.env.VITE_BACKEND_URL}/student/check-completion/${
          course._id
        }`,
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
        `${import.meta.env.VITE_BACKEND_URL}/student/enroll/${course._id}`,
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
        `${import.meta.env.VITE_BACKEND_URL}/student/unenroll/${course._id}`,
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
        `${import.meta.env.VITE_BACKEND_URL}/student/generate-certificate/${
          course._id
        }`,
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
    <div className="bg-zinc-900 rounded-xl shadow-2xl p-8 border border-zinc-800">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">
          {course.courseName}
        </h1>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-yellow-400 transition-colors duration-300"
        >
          <span className="text-2xl">←</span> Back
        </button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <span className="px-4 py-2 bg-zinc-800 rounded-lg text-gray-300 border border-zinc-700">
          Level:{" "}
          <span className="text-yellow-400 font-semibold">{course.level}</span>
        </span>

        {/* Enroll/Unenroll/Certificate buttons */}
        {!isEnrolled ? (
          <button
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300 disabled:opacity-50"
            onClick={handleEnroll}
            disabled={isProcessing}
          >
            {isProcessing ? "Enrolling..." : "Enroll Now"}
          </button>
        ) : isCertificateReady ? (
          <button
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300"
            onClick={handleGenerateCertificate}
          >
            Generate Certificate
          </button>
        ) : (
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
            onClick={handleUnenroll}
            disabled={isProcessing}
          >
            {isProcessing ? "Unenrolling..." : "Unenroll"}
          </button>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          Course Content
        </h2>

        {course.chapters.length > 0 ? (
          <div className="space-y-6">
            {course.chapters.map((chapter, idx) => (
              <div
                key={idx}
                className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-semibold text-white">
                    Chapter {idx + 1}: {chapter.title}
                  </h3>
                  {enrolledCourseDetails?.tickedChapters?.includes(
                    chapter._id
                  ) && (
                    <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Completed
                    </span>
                  )}
                </div>

                <p className="text-gray-400 mb-4">{chapter.description}</p>

                <div className="space-y-3">
                  {chapter.lessons.map((lesson, lessonIdx) => (
                    <div
                      key={lessonIdx}
                      className={`p-4 rounded-lg border border-zinc-700 ${
                        isEnrolled
                          ? "bg-zinc-700/50 hover:bg-zinc-700 cursor-pointer"
                          : "bg-zinc-800 opacity-50"
                      } transition-all duration-300`}
                      onClick={() => {
                        if (isEnrolled) {
                          setSelectedLesson(lesson);
                          setSelectedChapterId(chapter._id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-lg ${
                            isEnrolled ? "text-white" : "text-gray-500"
                          }`}
                        >
                          Lesson {lessonIdx + 1}: {lesson.title}
                        </span>
                        {enrolledCourseDetails?.tickedLessons?.includes(
                          lesson._id
                        ) && (
                          <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No chapters available for this course yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
