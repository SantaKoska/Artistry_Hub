import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiEdit, BiTrash } from "react-icons/bi"; // Import icons

const StudentCreateServiceRequest = () => {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null); // State for editing request

  // Fetch existing service requests
  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/student/my-service-requests",
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
    setImages(selectedImages);

    // Create image previews
    const previews = selectedImages.map((file) => URL.createObjectURL(file));
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
          `http://localhost:8000/student/service-requests/${editingRequest._id}`,
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
          "http://localhost:8000/student/create-service-request", // Changed endpoint for students
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
      request.images.map((img) => `http://localhost:8000${img}`)
    );
    setShowCreateRequest(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:8000/student/service-requests/${id}`, // Changed endpoint for students
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
        <h1 className="text-4xl font-bold text-yellow-400 mr-96">
          My Service Requests
        </h1>
        <button
          onClick={handleAddServiceRequest}
          className="text-lg font-medium bg-emerald-900 text-white hover:bg-yellow-400 hover:text-black py-3 px-8 rounded-lg transition-all duration-300"
        >
          Add Service Request
        </button>
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
                      src={`http://localhost:8000${img}`}
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
    </div>
  );
};

export default StudentCreateServiceRequest;
