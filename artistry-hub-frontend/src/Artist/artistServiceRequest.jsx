import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiEdit, BiTrash, BiBot } from "react-icons/bi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InstrumentServiceAssistant from "../components/InstrumentServiceAssistant";

const ArtistCreateServiceRequest = () => {
  const [description, setDescription] = useState("");
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [viewProviders, setViewProviders] = useState(false);
  const [acceptedProviders, setAcceptedProviders] = useState([]);
  const [userArtForm, setUserArtForm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmSelection, setConfirmSelection] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/my-service-requests`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const { artForm, serviceRequests: serviceRequestsData } = response.data;
        setServiceRequests(serviceRequestsData || []);
        setUserArtForm(artForm);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        setServiceRequests([]);
      }
    };
    fetchServiceRequests();
  }, []);

  useEffect(() => {
    if (userArtForm) {
      const fetchSpecializations = async () => {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/common-things/specializations/${userArtForm}`
          );
          setSpecializationOptions(response.data);
        } catch (error) {
          console.error("Error fetching specializations:", error);
        }
      };
      fetchSpecializations();
    }
  }, [userArtForm]);

  const handleImageChange = (e) => {
    const selectedImages = Array.from(e.target.files);
    if (images.length + selectedImages.length > 5) {
      toast.error("Image limit reached. Please remove some images.");
      return;
    }
    setImages((prev) => [...prev, ...selectedImages]);

    const previews = selectedImages.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("description", description);
    formData.append("specialization", selectedSpecialization);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      if (editingRequest) {
        const response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/artist/service-requests/${
            editingRequest._id
          }`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setServiceRequests((prevRequests) =>
          prevRequests.map((req) =>
            req._id === editingRequest._id ? response.data : req
          )
        );
        setEditingRequest(null);
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/artist/create-service-request`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setServiceRequests((prevRequests) => [...prevRequests, response.data]);
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setDescription(request.description);
    setSelectedSpecialization(request.specialization);
    setImagePreviews(
      request.images.map((img) => `${import.meta.env.VITE_BACKEND_URL}${img}`)
    );
    setShowModal(true);
  };

  const handleImageDelete = async (imagePath) => {
    if (!editingRequest) return;
    try {
      const relativeImagePath = imagePath.replace(
        `${import.meta.env.VITE_BACKEND_URL}`,
        ""
      );

      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/service-requests/${
          editingRequest._id
        }/images`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { imagePath: relativeImagePath },
        }
      );

      setImages(response.data.images);
      setImagePreviews(
        response.data.images.map(
          (img) => `${import.meta.env.VITE_BACKEND_URL}${img}`
        )
      );
      toast.success("Image removed successfully.");
    } catch (error) {
      toast.error("Failed to remove image. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/artist/service-requests/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setServiceRequests(serviceRequests.filter((req) => req._id !== id));
    } catch (error) {
      toast.error("Failed to delete service request. Please try again.");
    }
  };

  const resetForm = () => {
    setDescription("");
    setSelectedSpecialization("");
    setImages([]);
    setImagePreviews([]);
    setEditingRequest(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowModal(false);
  };

  const handleAddServiceRequest = () => {
    resetForm();
    setShowModal(true);
  };

  const handleConfirmSelection = (requestId, providerId) => {
    setSelectedProvider(providerId);
    setSelectedRequestId(requestId);
    setConfirmSelection(true);
  };

  const handleSelectProvider = async () => {
    if (!selectedRequestId || !selectedProvider) return;

    try {
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/artist/service-requests/${selectedRequestId}/select-provider`,
        { serviceProviderId: selectedProvider },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("Search for the service provider's name and connect.");
      navigate("/artist-Home/Message");
    } catch (error) {
      toast.error("Error selecting service provider. Please try again.");
    } finally {
      setConfirmSelection(false);
      setSelectedProvider(null);
      setSelectedRequestId(null);
    }
  };

  const handleFetchProviders = async (requestId) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/artist/service-requests/${requestId}/service-providers`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setAcceptedProviders(response.data);
      setViewProviders(true);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  return (
    <div className="bg-black text-white p-10 shadow-xl backdrop-filter backdrop-blur-md bg-opacity-40 w-full max-w-screen-xl mx-auto mt-16 rounded-xl">
      <div className="flex justify-between items-center border-b border-yellow-500 pb-4 mb-8">
        <h1 className="text-4xl font-bold text-yellow-500">
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
            className="text-lg font-medium bg-yellow-500 text-black hover:bg-yellow-600 py-3 px-8 rounded-lg transition-all duration-300"
          >
            Add Service Request
          </button>
        </div>
      </div>

      {serviceRequests.length === 0 ? (
        <p className="text-gray-400 text-center text-2xl font-light">
          No service requests found.
        </p>
      ) : (
        <ul className="space-y-6">
          {serviceRequests.map((request) => (
            <li
              key={request._id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-yellow-500 mb-2">
                    {request.description}
                  </h2>
                  {request.images && request.images.length > 0 && (
                    <div className="mt-2 flex space-x-2 overflow-x-auto">
                      {request.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL}${img}`}
                            alt={`request image ${index}`}
                            className="w-24 h-24 object-cover border border-yellow-500 rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(request)}
                    className="bg-yellow-500 text-black p-2 rounded-lg hover:bg-yellow-600 transition-all duration-300"
                    title="Edit"
                  >
                    <BiEdit className="text-xl" />
                  </button>
                  <button
                    onClick={() => handleDelete(request._id)}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all duration-300"
                    title="Delete"
                  >
                    <BiTrash className="text-xl" />
                  </button>
                  <button
                    onClick={() => handleFetchProviders(request._id)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
                    title="View Providers"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {viewProviders && (
                <div className="mt-2 text-yellow-500">
                  {acceptedProviders.length > 0 ? (
                    <>
                      <h3 className="text-lg font-medium text-yellow-500">
                        Accepted Providers:
                      </h3>
                      <ul className="list-disc pl-5">
                        {acceptedProviders.map((provider) => (
                          <li
                            key={provider._id}
                            className="mt-1 flex justify-between"
                          >
                            <div className="flex items-center mb-4">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  provider.profilePicture
                                }`}
                                alt={provider.userName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500"
                              />
                              <div className="ml-4">
                                <Link to={`/profile/${provider.userName}`}>
                                  <p className="font-bold text-lg text-yellow-500 hover:underline">
                                    {provider.userName}
                                  </p>
                                </Link>
                              </div>
                            </div>
                            {request.status !== "Accepted" && (
                              <button
                                onClick={() =>
                                  handleConfirmSelection(
                                    request._id,
                                    provider._id
                                  )
                                }
                                className="text-white bg-emerald-600 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                              >
                                Select
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-red-500 font-light">
                      No providers have accepted this request yet.
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center text-yellow-500">
              Confirm Selection
            </h2>
            <p className="mb-4 text-gray-800">
              Are you sure you want to select this service provider? After
              selecting, your request will be retrieved and you cannot select
              any other service providers.
            </p>
            <div className="flex justify-between">
              <button
                onClick={handleSelectProvider}
                className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700"
              >
                Yes, Select
              </button>
              <button
                onClick={() => setConfirmSelection(false)}
                className="bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center text-yellow-500">
              {editingRequest
                ? "Edit Service Request"
                : "Create Service Request"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-yellow-500 rounded-md bg-gray-800 text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Specialization:
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full p-2 border border-yellow-500 rounded-md bg-gray-800 text-white"
                  required
                >
                  <option value="">Select a specialization</option>
                  {specializationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Images:</label>
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="w-full text-white"
                />
                <div className="mt-4 flex space-x-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`preview ${index}`}
                        className="w-24 h-24 object-cover border border-yellow-500 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                      >
                        <BiTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-yellow-500 text-black py-2 px-4 rounded-md hover:bg-yellow-600"
                >
                  {editingRequest ? "Update Request" : "Create Request"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#1a1a1a] w-[95%] max-w-3xl h-[80vh] rounded-2xl shadow-2xl flex flex-col">
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
              <InstrumentServiceAssistant artForm={userArtForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCreateServiceRequest;
