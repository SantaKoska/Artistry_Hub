import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiEdit, BiTrash, BiBot } from "react-icons/bi"; // Import icons
import InstrumentServiceAssistant from "../components/InstrumentServiceAssistant";

const StudentCreateServiceRequest = () => {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null); // State for editing request
  const [showChat, setShowChat] = useState(false); // Add this state

  // Fetch existing service requests
  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/student/my-service-requests`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setServiceRequests(response.data || []);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        setServiceRequests([]);
      }
    };

    fetchServiceRequests();
  }, []);

  const handleImageChange = (e) => {
    const selectedImages = Array.from(e.target.files);
    const validImages = selectedImages.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImages.length !== selectedImages.length) {
      alert("Only image files are allowed.");
    }

    setImages(validImages);

    // Create image previews
    const previews = validImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("description", description);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      if (editingRequest) {
        // Handle Edit
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/student/service-requests/${
            editingRequest._id
          }`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // Update the request in the list
        setServiceRequests((prevRequests) =>
          prevRequests.map((req) =>
            req._id === editingRequest._id ? response.data : req
          )
        );
        setEditingRequest(null);
      } else {
        // Handle Create
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/student/create-service-request`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setServiceRequests((prevRequests) => [...prevRequests, response.data]);
      }

      // Reset the form after submission
      resetForm();
      setShowCreateRequest(false);
    } catch (error) {
      console.error("Error creating/updating service request:", error);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setDescription(request.description);
    setImagePreviews(
      request.images.map((img) => `${import.meta.env.VITE_BACKEND_URL}${img}`)
    );
    setShowCreateRequest(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/student/service-requests/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setServiceRequests(serviceRequests.filter((req) => req._id !== id));
    } catch (error) {
      console.error("Error deleting service request:", error);
    }
  };

  // Reset form fields and previews
  const resetForm = () => {
    setDescription("");
    setImages([]);
    setImagePreviews([]);
    setEditingRequest(null); // Reset editing state
  };

  const handleCancel = () => {
    resetForm();
    setShowCreateRequest(false);
  };

  const handleAddServiceRequest = () => {
    resetForm(); // Clear the form when adding a new request
    setShowCreateRequest(true);
  };

  return (
    <div className="bg-slate-900 p-10 shadow-xl backdrop-filter backdrop-blur-md bg-opacity-40 w-full max-w-screen-xl mx-auto mt-16 rounded-xl text-black">
      <div className="flex justify-between items-center border-b border-gray-500 pb-4 mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">
          My Service Requests
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowChat(true)} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex items-center gap-2 px-4 py-2 bg-black rounded-full leading-none">
              <BiBot className="text-2xl text-yellow-500" />
              <span className="text-yellow-500 font-medium">AI Assistant</span>
            </div>
          </button>
          <button
            onClick={handleAddServiceRequest}
            className="text-lg font-medium bg-emerald-900 text-white hover:bg-yellow-400 hover:text-black py-3 px-8 rounded-lg transition-all duration-300"
          >
            Add Service Request
          </button>
        </div>
      </div>

      {serviceRequests.length === 0 ? (
        <p className="text-white text-center text-2xl font-light">
          No service requests found.
        </p>
      ) : (
        <ul className="space-y-4">
          {serviceRequests.map((request) => (
            <li key={request._id} className="bg-gray-800 p-4 rounded-md">
              <p className="text-white">{request.description}</p>
              {request.images && request.images.length > 0 && (
                <div className="mt-2 flex space-x-2">
                  {request.images.map((img, index) => (
                    <img
                      key={index}
                      src={`${import.meta.env.VITE_BACKEND_URL}${img}`}
                      alt={`request image ${index}`}
                      className="w-20 h-20 object-cover border border-gray-300 rounded-md"
                    />
                  ))}
                </div>
              )}
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => handleEdit(request)}
                  className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-500 flex items-center"
                >
                  <BiEdit className="w-5 h-5 mr-2" /> {/* Edit icon */}
                </button>
                <button
                  onClick={() => handleDelete(request._id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 flex items-center"
                >
                  <BiTrash className="w-5 h-5 mr-2" /> {/* Delete icon */}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreateRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              {editingRequest
                ? "Edit Service Request"
                : "Create Service Request"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description (Please provide details about the service you
                  need)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700"
                >
                  Upload Images (You can upload a maximum of 5 images)
                </label>
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium">Image Previews:</h3>
                    <div className="flex space-x-2">
                      {imagePreviews.map((preview, index) => (
                        <img
                          key={index}
                          src={preview}
                          alt={`preview ${index}`}
                          className="w-20 h-20 object-cover border border-gray-300 rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="text-lg font-medium bg-emerald-900 text-white hover:bg-yellow-400 hover:text-black py-3 px-8 rounded-lg transition-all duration-300"
              >
                {editingRequest
                  ? "Update Service Request"
                  : "Submit Service Request"}
              </button>
              <button
                type="button"
                onClick={handleCancel} // Trigger cancel behavior
                className="text-lg font-medium border-2 border-yellow-500 bg-white text-red-500 hover:bg-red-500 hover:text-white ml-9 py-3 px-8 rounded-lg transition-all duration-300"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-60">
          <div className="bg-[#1a1a1a] w-[95%] max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col mt-80">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <BiBot className="text-2xl text-yellow-500" />
                <h2 className="text-xl font-semibold text-yellow-500">
                  Instrument Service Assistant
                </h2>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <InstrumentServiceAssistant />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCreateServiceRequest;
