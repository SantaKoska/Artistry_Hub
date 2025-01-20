import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const LessonDetails = ({ lesson, courseId, chapterId, onBack, onComplete }) => {
  const [isVideoWatched, setIsVideoWatched] = useState(false);
  const [isNoteOpened, setIsNoteOpened] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef(null);
  const token = localStorage.getItem("token");

  console.log(courseId);
  // Function to mark lesson as complete
  const markLessonAsComplete = async () => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/student/complete-lesson/${courseId}/${chapterId}/${lesson._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsCompleted(true);
      onComplete(); // To refresh the course details and update tick marks
    } catch (error) {
      // Handle if the lesson is already completed
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === "Lesson already completed"
      ) {
        setIsCompleted(true);
      } else {
        console.error(error.response?.data?.message);
      }
    }
  };

  // Watch for video completion
  const handleVideoEnded = () => {
    setIsVideoWatched(true);
  };

  // Watch for notes opened
  const handleNotesOpened = () => {
    setIsNoteOpened(true);
  };

  // Effect to check if both conditions are met to mark lesson complete
  useEffect(() => {
    if (isVideoWatched && (!lesson.noteUrl || isNoteOpened)) {
      markLessonAsComplete();
    }
  }, [isVideoWatched, isNoteOpened]);

  // Fetch the lesson completion status on component mount
  useEffect(() => {
    const checkLessonCompletion = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/student/course-progress/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const enrolledCourse = response.data;

        // Check if the lesson is marked as completed
        if (enrolledCourse.tickedLessons.includes(lesson._id)) {
          setIsCompleted(true);
        }
      } catch (error) {
        console.error("Error fetching lesson completion status:", error);
      }
    };

    checkLessonCompletion();
  }, [courseId, lesson._id]);

  return (
    <div className="bg-zinc-900 rounded-xl shadow-2xl p-8 border border-zinc-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold text-yellow-400">{lesson.title}</h2>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
        >
          <span className="text-2xl">←</span> Back to Course
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-lg mb-8 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
        {lesson.description}
      </p>

      {/* Video Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">
          Video Content
        </h3>
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          {lesson.mediaUrl ? (
            <video
              src={`${import.meta.env.VITE_BACKEND_URL}${lesson.mediaUrl}`}
              controls
              className="w-full rounded-lg shadow-lg"
              onEnded={handleVideoEnded}
              ref={videoRef}
            >
              <source
                src={`${import.meta.env.VITE_BACKEND_URL}${lesson.mediaUrl}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-gray-400 text-center py-8">
              No video content available for this lesson.
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">
          Study Materials
        </h3>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          {lesson.noteUrl ? (
            <a
              href={`${import.meta.env.VITE_BACKEND_URL}${lesson.noteUrl}`}
              className="inline-flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all duration-300"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleNotesOpened}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Study Materials
            </a>
          ) : (
            <div className="text-gray-400 text-center py-4">
              No study materials available for this lesson.
            </div>
          )}
        </div>
      </div>

      {/* Completion Status */}
      <div className="mt-8">
        {isCompleted ? (
          <div className="bg-green-400/10 text-green-400 p-4 rounded-lg border border-green-400/20 flex items-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg font-semibold">Lesson Completed!</span>
          </div>
        ) : (
          <div className="bg-yellow-400/10 text-yellow-400 p-4 rounded-lg border border-yellow-400/20 flex items-center gap-3">
            <svg
              className="w-6 h-6 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg font-semibold">
              Complete the video{lesson.noteUrl ? " and study materials" : ""}{" "}
              to finish this lesson
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetails;
