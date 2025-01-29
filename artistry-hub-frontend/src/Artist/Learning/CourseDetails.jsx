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
    <div className="bg-gray-900 text-white rounded-lg p-8 shadow-lg">
      <h1 className="text-5xl font-bold text-yellow-400 mb-6 border-b-2 border-yellow-400 pb-2">
        {course.courseName}
      </h1>
      <div className="flex justify-between mb-6">
        <button
          onClick={handleEditClick}
          className="bg-yellow-500 text-black p-3 rounded-lg hover:bg-yellow-400 transition duration-200"
        >
          <BiEdit className="w-5 h-5 inline" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-500 transition duration-200"
        >
          <BiTrash className="w-5 h-5 inline" />
        </button>
      </div>
      {course.chapters.map((chapter, index) => (
        <div key={chapter._id} className="mb-6">
          <h2
            className="text-3xl font-semibold cursor-pointer flex items-center border-b-2 border-gray-700 pb-2"
            onClick={() => toggleChapter(chapter._id)}
          >
            <span className="text-yellow-400">{`Chapter ${index + 1}: `}</span>
            {chapter.title}
            {expandedChapter === chapter._id ? (
              <BiChevronUp className="ml-2" />
            ) : (
              <BiChevronDown className="ml-2" />
            )}
          </h2>
          {expandedChapter === chapter._id && (
            <div className="bg-gray-800 p-4 rounded-lg mb-2 ml-4">
              <p className="text-gray-300 mb-2">
                {chapter.description.length > 100 &&
                !expandedChapterDescription[chapter._id]
                  ? `${chapter.description.slice(0, 100)}... `
                  : chapter.description}
                {chapter.description.length > 100 && (
                  <button
                    className="text-blue-400 hover:underline"
                    onClick={() => toggleChapterDescription(chapter._id)}
                  >
                    {expandedChapterDescription[chapter._id]
                      ? "Read Less"
                      : "Read More"}
                  </button>
                )}
              </p>
              <div className="mt-2">
                {chapter.lessons.map((lesson, index) => (
                  <div key={lesson._id} className="mb-4">
                    <h3
                      className="text-xl font-bold cursor-pointer flex items-center"
                      onClick={() => toggleLesson(lesson._id)}
                    >
                      <span className="text-yellow-400">{`Lesson ${
                        index + 1
                      }: `}</span>
                      {lesson.title}
                      <span className="ml-2">
                        {expandedLesson === lesson._id ? (
                          <BiChevronUp />
                        ) : (
                          <BiChevronDown />
                        )}
                      </span>
                    </h3>
                    {expandedLesson === lesson._id && (
                      <div className="bg-gray-700 p-4 rounded-lg mb-2 ml-4">
                        <p className="text-gray-300 mb-2">
                          {lesson.description.length > 100 &&
                          !expandedLessonDescription[lesson._id]
                            ? `${lesson.description.slice(0, 100)}... `
                            : lesson.description}
                          {lesson.description.length > 100 && (
                            <button
                              className="text-blue-400 hover:underline"
                              onClick={() =>
                                toggleLessonDescription(lesson._id)
                              }
                            >
                              {expandedLessonDescription[lesson._id]
                                ? "Read Less"
                                : "Read More"}
                            </button>
                          )}
                        </p>
                        {lesson.mediaUrl && (
                          <video
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              lesson.mediaUrl
                            }`}
                            controls
                            className="w-full rounded-lg"
                          />
                        )}
                        {lesson.noteUrl && (
                          <div className="mt-4 flex items-center">
                            <a
                              href={lesson.noteUrl}
                              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500 transition duration-200 flex items-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <BiDownload className="w-5 h-5 mr-2" />
                              Download Note
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CourseDetails;
