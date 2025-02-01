import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BiEdit,
  BiTrash,
  BiChevronDown,
  BiChevronUp,
  BiDownload,
} from "react-icons/bi";

const CourseDetails = ({ courseId, setActiveSection, setSelectedCourse }) => {
  const [course, setCourse] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedChapterDescription, setExpandedChapterDescription] = useState(
    {}
  );
  const [expandedLessonDescription, setExpandedLessonDescription] = useState(
    {}
  );
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  console.log(selectedLesson);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCourse(response.data);
      } catch (error) {
        console.error("Error fetching course details:", error);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleEditClick = () => {
    setSelectedCourse(course);
    setActiveSection("editCourse");
  };

  const handleDeleteClick = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/delete-course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setActiveSection("myCourses");
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedLesson(null);
    setExpandedChapter(chapter._id);
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setExpandedLesson(lesson._id);
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const toggleLesson = (lessonId) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const toggleChapterDescription = (chapterId) => {
    setExpandedChapterDescription((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleLessonDescription = (lessonId) => {
    setExpandedLessonDescription((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  if (!course) return <p>Loading...</p>;

  return (
    <div className="flex h-screen">
      {/* Navigation Sidebar */}
      <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
        {course.chapters.map((chapter, index) => (
          <div key={chapter._id} className="mb-4">
            <div
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                selectedChapter?._id === chapter._id ? "bg-gray-700" : ""
              }`}
              onClick={() => handleChapterClick(chapter)}
            >
              <h2 className="text-xl font-semibold text-yellow-400">
                {`Chapter ${index + 1}: ${chapter.title}`}
              </h2>
              {expandedChapter === chapter._id ? (
                <BiChevronUp className="text-yellow-400" />
              ) : (
                <BiChevronDown className="text-yellow-400" />
              )}
            </div>
            {expandedChapter === chapter._id && (
              <div className="ml-4 mt-2">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson._id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedLesson?._id === lesson._id ? "bg-gray-700" : ""
                    }`}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <h3 className="text-lg text-gray-300">
                      {`Lesson ${lessonIndex + 1}: ${lesson.title}`}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="w-3/4 bg-gray-900 text-white p-8 overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-5xl font-bold text-yellow-400 border-b-2 border-yellow-400 pb-2">
            {course.courseName}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleEditClick}
              className="bg-yellow-500 text-black p-3 rounded-lg hover:bg-yellow-400 transition duration-200"
            >
              <BiEdit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-500 transition duration-200"
            >
              <BiTrash className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Display Chapter Content */}
        {selectedChapter && !selectedLesson && (
          <div className="mt-6">
            <h2 className="text-3xl font-semibold mb-4">
              {selectedChapter.title}
            </h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300">{selectedChapter.description}</p>
            </div>
          </div>
        )}

        {/* Display Lesson Content */}
        {selectedLesson && (
          <div className="mt-6">
            <h2 className="text-3xl font-semibold mb-4">
              {selectedLesson.title}
            </h2>
            <div className="space-y-6">
              {selectedLesson.mediaUrl && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Video</h3>
                  <video
                    controls
                    className="w-full rounded"
                    src={`${import.meta.env.VITE_BACKEND_URL}${
                      selectedLesson.mediaUrl
                    }`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {selectedLesson.description && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Description</h3>
                  <p className="text-gray-300">{selectedLesson.description}</p>
                </div>
              )}

              {selectedLesson.noteUrl && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Notes</h3>
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL}${
                      selectedLesson.noteUrl
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2"
                  >
                    <BiDownload /> Download Notes
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
