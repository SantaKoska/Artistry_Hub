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
        `${process.env.REACT_APP_BACKEND_URL}/student/complete-lesson/${courseId}/${chapterId}/${lesson._id}`,
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
          `${process.env.REACT_APP_BACKEND_URL}/student/course-progress/${courseId}`,
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
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">
        Lesson: {lesson.title}
      </h2>
      <p className="text-xl text-gray-400 mb-4">{lesson.description}</p>

      {/* Video Section */}
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-emerald-500 mb-2">Video</h3>
        {lesson.mediaUrl ? (
          <video
            src={`${process.env.REACT_APP_BACKEND_URL}${lesson.mediaUrl}`}
            controls
            className="w-full rounded-lg shadow-lg"
            onEnded={handleVideoEnded}
            ref={videoRef}
          >
            <source
              src={`${process.env.REACT_APP_BACKEND_URL}${lesson.mediaUrl}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p className="text-gray-500">No video available for this lesson.</p>
        )}
      </div>

      {/* Notes Section */}
      <div className="mb-4">
        <h3 className="text-2xl font-semibold text-emerald-500 mb-2">Notes</h3>
        {lesson.noteUrl ? (
          <a
            href={`${process.env.REACT_APP_BACKEND_URL}${lesson.noteUrl}`}
            className="text-emerald-400 hover:text-emerald-300"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNotesOpened}
          >
            View Notes
          </a>
        ) : (
          <p className="text-gray-500">No notes available for this lesson.</p>
        )}
      </div>

      {/* Back Button */}
      <button
        className="mt-6 bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        onClick={onBack}
      >
        Back to Course Details
      </button>

      {/* Completion Status */}
      {isCompleted ? (
        <div className="mt-4 text-green-400 text-lg font-semibold">
          ✅ Lesson Completed!
        </div>
      ) : (
        <div className="mt-4 text-yellow-400 text-lg">
          ⏳ Complete the video and notes to mark this lesson as done.
        </div>
      )}
    </div>
  );
};

export default LessonDetails;
