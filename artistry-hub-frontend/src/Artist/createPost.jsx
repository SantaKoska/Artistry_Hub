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
    <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full max-w-screen-lg mx-auto mt-8">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows="4"
          />
        </div>

        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="text-white"
            accept="image/*,video/*,audio/*" // restrict file types
          />
        </div>

        {/* media Preview */}
        {previewUrl && mediaType === "image" && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-md"
            />
          </div>
        )}

        {previewUrl && mediaType === "video" && (
          <div className="mb-4">
            <video controls className="w-full h-auto rounded-md">
              <source src={previewUrl} type="video/mp4" />
            </video>
          </div>
        )}

        {previewUrl && mediaType === "audio" && (
          <div className="mb-4">
            <audio controls className="w-full">
              <source src={previewUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}

        <button
          type="submit"
          className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
        >
          Create Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
