import React, { useState, useEffect } from "react";
import { BiEdit, BiTrash } from "react-icons/bi";
import { BiPlus, BiError } from "react-icons/bi";
import axios from "axios";

const EditCourse = ({ selectedCourse }) => {
  const [courseData, setCourseData] = useState(selectedCourse);
  const [videoPreview, setVideoPreview] = useState(null);
  const [notePreview, setNotePreview] = useState(null);
  const [newVideoPreview, setNewVideoPreview] = useState(null);
  const [newNotePreview, setNewNotePreview] = useState(null);

  const [newChapter, setNewChapter] = useState({ title: "", description: "" });
  const token = localStorage.getItem("token");
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    mediaUrl: null,
    noteUrl: null,
  });

  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editedChapter, setEditedChapter] = useState({
    title: "",
    description: "",
  });
  const [editedLesson, setEditedLesson] = useState({
    title: "",
    description: "",
    newMediaUrl: "",
    newNoteUrl: "",
  });

  const [editingCourse, setEditingCourse] = useState(false);
  const [editedCourse, setEditedCourse] = useState({
    courseName: courseData.courseName,
    level: courseData.level,
  });

  useEffect(() => {
    setCourseData(selectedCourse);
  }, [selectedCourse]);

  const showToast = (message) => {
    alert(message);
  };

  const handleEditCourse = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/artist/edit-course/${
          courseData._id
        }`,
        editedCourse,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(res.data);
      setEditingCourse(false);
    } catch (error) {
      console.error("Error editing course", error);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapter.title || !newChapter.description) {
      showToast("Please fill out the chapter title and description.");
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/artist/add-chapter/${
          courseData._id
        }`,
        newChapter,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(res.data);
      setNewChapter({ title: "", description: "" });
      showToast("Chapter added successfully!");
      setCourseData(res.data); // Reload component data to refresh preview
    } catch (error) {
      console.error("Error adding chapter", error);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Are you sure you want to delete this chapter?"))
      return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/delete-chapter/${
          courseData._id
        }/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(res.data);
    } catch (error) {
      console.error("Error deleting chapter", error);
    }
  };

  const handleEditChapter = async (
    chapterId,
    updatedTitle,
    updatedDescription
  ) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/artist/edit-chapter/${
          courseData._id
        }/${chapterId}`,
        {
          title: updatedTitle,
          description: updatedDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(res.data);
      showToast("Edited successfully!"); // Show success toast
    } catch (error) {
      console.error("Error editing chapter", error);
    }
  };

  const handleAddLesson = async (chapterId) => {
    const formData = new FormData();
    formData.append("title", newLesson.title);
    formData.append("description", newLesson.description);

    // Check if media file is video
    if (
      newLesson.mediaUrl &&
      newLesson.mediaUrl.type.split("/")[0] !== "video"
    ) {
      showToast("Only video files are allowed for media.");
      return;
    }
    if (newLesson.mediaUrl) formData.append("video", newLesson.mediaUrl);

    // Check if note file is PDF
    if (newLesson.noteUrl && newLesson.noteUrl.type !== "application/pdf") {
      showToast("Only PDF files are allowed for notes.");
      return;
    }
    if (newLesson.noteUrl) formData.append("note", newLesson.noteUrl);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/artist/add-lesson/${
          courseData._id
        }/${chapterId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setCourseData(res.data);
      setNewLesson({
        title: "",
        description: "",
        mediaUrl: null,
        noteUrl: null,
      });
      showToast("Lesson added successfully!");
      setCourseData(res.data); // Reload component data to refresh preview
    } catch (error) {
      console.error("Error adding lesson", error);
    }
  };

  const handleDeleteLesson = async (chapterId, lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/delete-lesson/${
          courseData._id
        }/${chapterId}/${lessonId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(res.data);
    } catch (error) {
      console.error("Error deleting lesson", error);
    }
  };

  const handleEditLesson = async (chapterId, lessonId, updatedLesson) => {
    const formData = new FormData();
    formData.append("title", updatedLesson.title);
    formData.append("description", updatedLesson.description);

    // Check if new media file is video
    if (
      updatedLesson.newMediaUrl &&
      updatedLesson.newMediaUrl.type.split("/")[0] !== "video"
    ) {
      showToast("Only video files are allowed for media.");
      return;
    }
    if (updatedLesson.newMediaUrl)
      formData.append("video", updatedLesson.newMediaUrl);

    // Check if new note file is PDF
    if (
      updatedLesson.newNoteUrl &&
      updatedLesson.newNoteUrl.type !== "application/pdf"
    ) {
      showToast("Only PDF files are allowed for notes.");
      return;
    }
    if (updatedLesson.newNoteUrl)
      formData.append("note", updatedLesson.newNoteUrl);

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/artist/edit-lesson/${
          courseData._id
        }/${chapterId}/${lessonId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setCourseData(res.data);
      setNewVideoPreview(null);
      setNewNotePreview(null);
      showToast("Edited successfully!"); // Show success toast
    } catch (error) {
      console.error("Error editing lesson", error);
    }
  };

  return (
    <div className="bg-black text-white rounded-lg p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-40 relative">
      {/* Course Header */}
      <div className="mb-6">
        {editingCourse ? (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-yellow-400">Edit Course</h1>
            <div className="relative my-4">
              <input
                type="text"
                value={editedCourse.courseName}
                onChange={(e) =>
                  setEditedCourse({
                    ...editedCourse,
                    courseName: e.target.value,
                  })
                }
                className="block w-full py-2.4 px-0 text-base text-white font-semibold bg-transparent border-b-2 border-yellow-500 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer"
                placeholder=" "
                required
              />
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
                Course Name
              </label>
            </div>
            <div className="relative my-4">
              <select
                value={editedCourse.level}
                onChange={(e) =>
                  setEditedCourse({ ...editedCourse, level: e.target.value })
                }
                className="block w-full py-2.4 text-base text-white font-semibold bg-transparent border-b-2 border-yellow-500 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Professional">Professional</option>
              </select>
              <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400">
                Level
              </label>
            </div>
            <button
              onClick={handleEditCourse}
              className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-yellow-500 text-black hover:bg-yellow-400 py-2 transition-colors duration-400"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-yellow-400">
              {courseData.courseName}
            </h1>
            <p className="text-lg italic text-gray-300">{courseData.level}</p>
            <button
              onClick={() => setEditingCourse(true)}
              className="text-yellow-400 hover:text-yellow-500"
            >
              <BiEdit className="inline-block text-2xl" />
            </button>
          </div>
        )}
      </div>

      {/* Chapters Section */}
      <div className="bg-gray-900 shadow-lg rounded-md p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Chapters</h2>
        {courseData.chapters.map((chapter) => (
          <div
            key={chapter._id}
            className="mb-4 bg-gray-800 rounded-md p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              {editingChapterId === chapter._id ? (
                <>
                  <input
                    type="text"
                    value={editedChapter.title}
                    onChange={(e) =>
                      setEditedChapter({
                        ...editedChapter,
                        title: e.target.value,
                      })
                    }
                    className="block w-full py-2.4 px-0 text-lg font-semibold bg-transparent border-b-2 border-yellow-500 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer"
                    placeholder=" "
                    required
                  />
                  <button
                    onClick={() => {
                      handleEditChapter(
                        chapter._id,
                        editedChapter.title,
                        editedChapter.description
                      );
                      setEditingChapterId(null);
                    }}
                    className="ml-2 mb-2 w-24 text-lg font-semibold rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition duration-300"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-yellow-300">
                    {chapter.title}
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setEditingChapterId(chapter._id);
                        setEditedChapter({
                          title: chapter.title,
                          description: chapter.description,
                        });
                      }}
                      className="text-yellow-400 hover:text-yellow-500"
                    >
                      <BiEdit className="inline-block" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chapter._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BiTrash className="inline-block" />
                    </button>
                  </div>
                </>
              )}
            </div>
            {editingChapterId === chapter._id ? (
              <textarea
                value={editedChapter.description}
                onChange={(e) =>
                  setEditedChapter({
                    ...editedChapter,
                    description: e.target.value,
                  })
                }
                className="w-full h-24 border border-gray-300 rounded-md p-2 bg-gray-700 text-white"
              />
            ) : (
              <p className="text-gray-400 mb-4">{chapter.description}</p>
            )}

            {/* Lessons Section */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <h4 className="font-bold mb-2 text-yellow-400">Lessons</h4>
              {chapter.lessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="mb-2 flex flex-col justify-between items-start"
                >
                  {editingLessonId === lesson._id ? (
                    <>
                      <input
                        type="text"
                        value={editedLesson.title}
                        onChange={(e) =>
                          setEditedLesson({
                            ...editedLesson,
                            title: e.target.value,
                          })
                        }
                        className="text-sm font-semibold border border-gray-300 rounded-md p-1 mb-2 bg-gray-700 text-white"
                      />
                      <textarea
                        value={editedLesson.description}
                        onChange={(e) =>
                          setEditedLesson({
                            ...editedLesson,
                            description: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-md p-1 mb-2 bg-gray-700 text-white"
                      />

                      {/* Current Media Previews */}
                      <div className="mb-2">
                        <h5 className="font-bold mb-1 text-yellow-400">
                          Current Media
                        </h5>

                        <h6 className="font-bold mb-1">Current Video</h6>
                        {/* Current Video Preview */}
                        {lesson.mediaUrl && (
                          <div className="mb-2">
                            <video
                              controls
                              src={`${import.meta.env.VITE_BACKEND_URL}${
                                lesson.mediaUrl
                              }`}
                              className="w-full max-w-sm h-auto rounded-md"
                            ></video>
                          </div>
                        )}

                        <h6 className="font-bold mb-1">Current Note</h6>

                        {/* Current Note Preview */}
                        {lesson.noteUrl && (
                          <div className="mb-2">
                            <iframe
                              src={`${import.meta.env.VITE_BACKEND_URL}${
                                lesson.noteUrl
                              }`}
                              className="w-full max-w-sm h-64 border rounded-md"
                            ></iframe>
                          </div>
                        )}
                      </div>

                      {/* New Media Upload */}
                      <div className="mb-2">
                        <h5 className="font-bold mb-1 text-yellow-400">
                          Update With New Media
                        </h5>

                        <h6 className="font-bold mb-1">Video</h6>
                        {/* New Video Upload */}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            const videoPreviewURL = URL.createObjectURL(file);
                            setEditedLesson({
                              ...editedLesson,
                              newMediaUrl: file,
                            });
                            setNewVideoPreview(videoPreviewURL); // Set new video preview
                          }}
                          className="mb-2 bg-gray-700 text-white"
                        />

                        {/* New Video Preview */}
                        {newVideoPreview && (
                          <div className="mb-2">
                            <video
                              controls
                              src={newVideoPreview}
                              className="w-full max-w-sm h-auto rounded-md"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}

                        <h6 className="font-bold mb-1">Note</h6>
                        {/* New Note Upload */}
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            const notePreviewURL = URL.createObjectURL(file);
                            setEditedLesson({
                              ...editedLesson,
                              newNoteUrl: file,
                            });
                            setNewNotePreview(notePreviewURL); // Set new note preview
                          }}
                          className="mb-2 bg-gray-700 text-white"
                        />

                        {/* New Note Preview */}
                        {newNotePreview && (
                          <div className="mb-2">
                            <iframe
                              src={newNotePreview}
                              className="w-full max-w-sm h-64 border rounded-md"
                            ></iframe>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          handleEditLesson(
                            chapter._id,
                            lesson._id,
                            editedLesson
                          );
                          setEditingLessonId(null);
                        }}
                        className="bg-yellow-500 text-black py-1 px-2 rounded hover:bg-yellow-400"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold">{lesson.title}</p>
                        <p className="text-sm text-gray-400">
                          {lesson.description}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setEditingLessonId(lesson._id);
                            setEditedLesson({
                              title: lesson.title,
                              description: lesson.description,
                              mediaUrl: lesson.mediaUrl,
                              noteUrl: lesson.noteUrl,
                            });
                          }}
                          className="text-yellow-400 hover:text-yellow-500"
                        >
                          <BiEdit className="inline-block" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteLesson(chapter._id, lesson._id)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <BiTrash className="inline-block" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add New Lesson Section */}
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2 text-yellow-400">
                  Add New Lesson
                </h4>

                <input
                  type="text"
                  name="title"
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                  placeholder="Lesson Title"
                  className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-600 text-white"
                />

                <textarea
                  name="description"
                  value={newLesson.description}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, description: e.target.value })
                  }
                  placeholder="Lesson Description"
                  className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-600 text-white"
                ></textarea>

                {/* Video Upload */}
                <input
                  type="file"
                  name="mediaUrl"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setNewLesson({ ...newLesson, mediaUrl: file });
                    const videoURL = URL.createObjectURL(file);
                    setVideoPreview(videoURL); // set video preview
                  }}
                  className="mb-2 bg-gray-700 text-white"
                />

                {/* Video Preview */}
                {videoPreview && (
                  <div className="mb-2">
                    <video
                      controls
                      src={videoPreview}
                      className="w-full max-w-sm h-auto mb-2 rounded-md"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Note Upload */}
                <input
                  type="file"
                  name="noteUrl"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setNewLesson({ ...newLesson, noteUrl: file });
                    const noteURL = URL.createObjectURL(file);
                    setNotePreview(noteURL); // set note preview
                  }}
                  className="mb-2 bg-gray-700 text-white"
                />

                {/* PDF Preview */}
                {notePreview && (
                  <div className="mb-2">
                    <iframe
                      src={notePreview}
                      className="w-full max-w-sm h-64 border rounded-md"
                    ></iframe>
                  </div>
                )}

                {/* Validation message */}
                {(!newLesson.title || !newLesson.mediaUrl) && (
                  <p className="text-red-500 text-sm mb-2 flex items-center">
                    <BiError className="mr-1" /> {/* Error icon */}
                    Please provide both a title and a video for the lesson.
                  </p>
                )}

                <button
                  onClick={() => {
                    if (newLesson.title && newLesson.mediaUrl) {
                      handleAddLesson(chapter._id);
                    }
                  }}
                  className={`flex items-center bg-yellow-500 text-black py-1 px-2 rounded hover:bg-yellow-400 ${
                    !newLesson.title || !newLesson.mediaUrl
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!newLesson.title || !newLesson.mediaUrl} // Disable button if validation fails
                >
                  <BiPlus className="mr-1" /> {/* Plus icon */}
                  Add Lesson
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Chapter Section */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-4 text-yellow-400">
            Add New Chapter
          </h2>
          <input
            type="text"
            name="title"
            value={newChapter.title}
            onChange={(e) =>
              setNewChapter({ ...newChapter, title: e.target.value })
            }
            placeholder="Chapter Title"
            className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-600 text-white"
          />
          <textarea
            name="description"
            value={newChapter.description}
            onChange={(e) =>
              setNewChapter({ ...newChapter, description: e.target.value })
            }
            placeholder="Chapter Description"
            className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-600 text-white"
          ></textarea>
          <button
            onClick={handleAddChapter}
            className={`flex items-center bg-yellow-500 text-black py-2 px-4 rounded hover:bg-yellow-400 ${
              !newChapter.title ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!newChapter.title} // Disable button if the title is empty
          >
            <BiPlus className="mr-1" /> {/* Plus icon */}
            Add Chapter
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
