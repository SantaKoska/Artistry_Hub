import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddCourse = () => {
  const [courseName, setCourseName] = useState("");
  const [level, setLevel] = useState("");
  const [chapters, setChapters] = useState([]);
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    lessons: [],
  });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    video: null,
    note: null,
  });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
  const [courseCreated, setCourseCreated] = useState(false); // Step Control
  const [courseId, setCourseId] = useState(null); // Store the created course ID
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Function to handle course submission
  const handleCourseSubmit = async () => {
    if (!courseName || !level) {
      alert("Please provide both course name and level.");
      return;
    }

    setIsSubmittingCourse(true);
    setError(null);

    try {
      const createCourseResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/artist/create-course`,
        { courseName, level },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const createdCourseId = createCourseResponse.data._id;
      setCourseId(createdCourseId);
      toast.success("Course created successfully!");
      setCourseCreated(true); // Allow adding chapters
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while creating the course."
      );
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Function to add a new chapter
  const addChapter = async () => {
    if (!newChapter.title || !newChapter.description) {
      alert("Please provide both title and description for the chapter.");
      return;
    }

    setIsSubmittingChapter(true);
    setError(null);

    try {
      const addChapterResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/artist/add-chapter/${courseId}`,
        { title: newChapter.title, description: newChapter.description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const addedChapter =
        addChapterResponse.data.chapters[
          addChapterResponse.data.chapters.length - 1
        ];

      const chapterId = addedChapter._id;
      setChapters([...chapters, { ...newChapter, id: chapterId, lessons: [] }]);
      setNewChapter({ title: "", description: "", lessons: [] });
      toast.success("Chapter added successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while adding the chapter."
      );
    } finally {
      setIsSubmittingChapter(false);
    }
  };

  const videoInputRef = useRef(null); // Add ref for video input
  const noteInputRef = useRef(null); // Add ref for note input

  // Function to add a lesson
  const addLesson = async (chapterIndex) => {
    const chapter = chapters[chapterIndex];
    if (!newLesson.title || !newLesson.description) {
      alert("Please provide both title and description for the lesson.");
      return;
    }
    if (chapter.lessons.length >= 10) {
      alert("Cannot add more than 10 lessons to this chapter.");
      return;
    }

    // File type validation
    if (newLesson.video && newLesson.video.type.split("/")[0] !== "video") {
      toast.error("Only video files are allowed for media.");
      return;
    }
    if (newLesson.note && newLesson.note.type !== "application/pdf") {
      toast.error("Only PDF files are allowed for notes.");
      return;
    }

    const formData = new FormData();
    formData.append("title", newLesson.title);
    formData.append("description", newLesson.description);
    if (newLesson.video) formData.append("video", newLesson.video);
    if (newLesson.note) formData.append("note", newLesson.note);

    setIsSubmittingLesson(true);
    setError(null);

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/artist/add-lesson/${courseId}/${
          chapter.id
        }`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex].lessons.push({ ...newLesson });
      setChapters(updatedChapters);
      setNewLesson({ title: "", description: "", video: null, note: null });

      if (videoInputRef.current) videoInputRef.current.value = "";
      if (noteInputRef.current) noteInputRef.current.value = "";

      toast.success("Lesson added successfully!");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "An error occurred while adding the lesson."
      );
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  return (
    <div className="bg-black text-white rounded-lg shadow-lg p-10 w-96 mx-auto">
      <div className="flex justify-center mb-6">
        <h1 className="text-4xl font-bold text-center mb-6 text-yellow-500">
          Add New Course
        </h1>
      </div>

      {/* Display error if any */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {!courseCreated ? (
        <>
          {/* Course Details */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="block w-full py-3 px-4 text-base text-black border border-yellow-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter course name"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Level
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Beginner"
                  checked={level === "Beginner"}
                  onChange={(e) => setLevel(e.target.value)}
                  className="form-radio text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-gray-700">Beginner</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="Intermediate"
                  checked={level === "Intermediate"}
                  onChange={(e) => setLevel(e.target.value)}
                  className="form-radio text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-gray-700">Intermediate</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="Professional"
                  checked={level === "Professional"}
                  onChange={(e) => setLevel(e.target.value)}
                  className="form-radio text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-gray-700">Professional</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCourseSubmit}
            className={`w-full mb-4 text-lg font-semibold rounded bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-colors duration-300 ${
              isSubmittingCourse ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmittingCourse}
          >
            {isSubmittingCourse ? "Creating Course..." : "Create Course"}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-yellow-500 mb-4">Chapters</h2>
          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapterIndex}
              className="bg-gray-800 border border-gray-600 p-5 rounded-lg mb-6 shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">
                Chapter {chapterIndex + 1}: {chapter.title}
              </h3>

              {/* Lesson Section */}
              <h4 className="text-lg font-semibold text-gray-300 mb-4">
                Add New Lesson
              </h4>

              <div className="mb-4">
                <label className="block text-md font-medium text-gray-300 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                  className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                  placeholder="Lesson Title"
                />
              </div>

              <div className="mb-4">
                <label className="block text-md font-medium text-gray-300 mb-1">
                  Lesson Description
                </label>
                <textarea
                  value={newLesson.description}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, description: e.target.value })
                  }
                  className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                  placeholder="Lesson Description"
                ></textarea>
              </div>

              {/* Video Upload */}
              <div className="mb-4">
                <label className="block text-md font-medium text-gray-300 mb-1">
                  Upload Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  required
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, video: e.target.files[0] })
                  }
                  className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                />
                {newLesson.video && (
                  <video
                    className="mt-3 w-64 h-36"
                    controls
                    src={URL.createObjectURL(newLesson.video)}
                  />
                )}
              </div>

              {/* Note Upload */}
              <div className="mb-4">
                <label className="block text-md font-medium text-gray-300 mb-1">
                  Upload Notes (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, note: e.target.files[0] })
                  }
                  className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                />
                {newLesson.note && (
                  <iframe
                    className="mt-3 w-64 h-36"
                    src={URL.createObjectURL(newLesson.note)}
                    title="PDF Preview"
                  />
                )}
              </div>

              <button
                onClick={() => addLesson(chapterIndex)}
                className={`bg-yellow-500 text-black px-6 py-3 rounded ${
                  isSubmittingLesson
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-yellow-400"
                } transition`}
                disabled={isSubmittingLesson}
              >
                {isSubmittingLesson ? "Adding Lesson..." : "Add Lesson"}
              </button>
            </div>
          ))}

          {/* New Chapter Section */}
          <div className="my-8 p-5 border-t-2 border-dashed border-gray-600">
            <h4 className="text-xl font-semibold text-yellow-500 mb-4">
              Add New Chapter
            </h4>

            <div className="mb-4">
              <label className="block text-md font-medium text-gray-300 mb-1">
                Chapter Title
              </label>
              <input
                type="text"
                value={newChapter.title}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, title: e.target.value })
                }
                className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                placeholder="Chapter Title"
              />
            </div>

            <div className="mb-4">
              <label className="block text-md font-medium text-gray-300 mb-1">
                Chapter Description
              </label>
              <textarea
                value={newChapter.description}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, description: e.target.value })
                }
                className="border border-gray-500 p-2 rounded-lg w-full bg-gray-700 text-white"
                placeholder="Chapter Description"
              ></textarea>
            </div>

            <button
              onClick={addChapter}
              className={`bg-yellow-500 text-black px-6 py-3 rounded ${
                isSubmittingChapter
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-yellow-400"
              } transition`}
              disabled={isSubmittingChapter}
            >
              {isSubmittingChapter ? "Adding Chapter..." : "Add Chapter"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddCourse;
