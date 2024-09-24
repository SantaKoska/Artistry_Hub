import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(""); // image, video, audio
  const [previewUrl, setPreviewUrl] = useState(null); // for media preview

  const token = localStorage.getItem("token"); // JWT token for authorization
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setMediaFile(file);

    // Generate a preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Determine media type based on file type
    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      toast.error("Unsupported media format");
      setMediaFile(null);
      setMediaType("");
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content && !mediaFile) {
      toast.error("Post content or media is required!");
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    if (mediaFile) {
      formData.append("media", mediaFile); // append the media file
      formData.append("mediaType", mediaType); // send media type to backend
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/posts/create-post",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", // for file uploads
          },
        }
      );
      toast.success("Post created successfully!");
      setContent("");
      setMediaFile(null);
      setMediaType("");
      setPreviewUrl(null); // reset preview
      navigate("/artist-Home");
    } catch (error) {
      toast.error(`Failed to create post: ${error.response?.data?.error}`);
    }
  };

  return (
    <div className="bg-slate-800 justify rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full max-w-screen-2xl h-full mx-auto mt-8">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-6 py-4 bg-gray-700 text-white text-lg border-2 border-gray-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-500 resize-none transition-transform duration-200 hover:scale-105"
            rows="4"
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-yellow-400 mb-2">
            Upload Media
          </label>
          <div className="relative cursor-pointer bg-gradient-to-r from-yellow-400 to-emerald-900 rounded-full overflow-hidden inline-block">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*,video/*,audio/*" // restrict file types
            />
            <div className="flex items-center justify-center py-2 px-6 text-white font-semibold bg-opacity-50 hover:bg-opacity-70 transition-all duration-300">
              Choose File
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 16s3-3 7-3 7 3 7 3v4H3v-4z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* media Preview */}
        {previewUrl && mediaType === "image" && (
          <div className="mb-6">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg shadow-lg transition-transform duration-200 hover:scale-105"
            />
          </div>
        )}

        {previewUrl && mediaType === "video" && (
          <div className="mb-6">
            <video controls className="w-full h-auto rounded-lg shadow-lg">
              <source src={previewUrl} type="video/mp4" />
            </video>
          </div>
        )}

        {previewUrl && mediaType === "audio" && (
          <div className="mb-6">
            <audio controls className="w-full rounded-lg shadow-lg">
              <source src={previewUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}

        <button
          type="submit"
          className="w-full text-[20px] font-semibold mt-6 rounded-full bg-yellow-400 text-black hover:bg-emerald-900 hover:text-white py-3 transition-colors duration-400 transform hover:scale-105"
        >
          Create Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
