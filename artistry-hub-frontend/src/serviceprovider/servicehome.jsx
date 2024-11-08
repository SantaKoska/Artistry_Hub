import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ServiceProviderHome = () => {
  const [requests, setRequests] = useState([]);
  const [specialization, setSpecialization] = useState("All");
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const token = localStorage.getItem("token");
  const [userArtForm, setUserArtForm] = useState(null);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/service/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            specialization,
          },
        }
      );

      setRequests(response.data.requests);
      setFilteredRequests(response.data.requests);

      if (response.data.requests.length > 0) {
        const artForm = response.data.artform;
        setUserArtForm(artForm);
      }
    } catch (error) {
      console.error("Error fetching service requests:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [specialization, token]);

  useEffect(() => {
    const fetchSpecializations = async () => {
      if (userArtForm) {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/common-things/specializations/${userArtForm}`
          );
          setSpecializations(response.data);
        } catch (error) {
          console.error("Error fetching specializations:", error);
        }
      }
    };

    fetchSpecializations();
  }, [userArtForm]);

  const handleAccept = async (requestId) => {
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/service/requests/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Request accepted!");
      fetchRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request.");
    }
  };

  const handleIgnore = async (requestId) => {
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/service/requests/${requestId}/ignore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.info("Request ignored.");
      fetchRequests();
    } catch (error) {
      console.error("Error ignoring request:", error);
      toast.error("Failed to ignore request.");
    }
  };

  const handleSpecializationChange = (event) => {
    setSpecialization(event.target.value);
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

      {/* Filter Section */}
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-800 rounded-lg shadow-lg">
        <label
          htmlFor="specialization"
          className="text-lg font-bold text-yellow-400"
        >
          Specialization:
        </label>
        <select
          id="specialization"
          value={specialization}
          onChange={handleSpecializationChange}
          className="ml-4 p-2 border border-gray-600 rounded-md bg-transparent text-black"
        >
          <option value="All">All</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 text-yellow-400 font-bold text-lg mb-2 p-2 bg-gray-700 rounded-md">
        <div>Profile</div>
        <div>Description</div>
        <div>Images</div>
        <div>Actions</div>
      </div>

      {/* Service Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-2">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="grid grid-cols-4 gap-4 items-center p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg transition-transform transform hover:scale-105"
            >
              {/* Profile Picture and Name */}
              <div className="flex items-center">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    request.userId.profilePicture
                  }`}
                  alt={request.userId.userName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500"
                />
                <Link
                  to={`/Service-Provider-home/profile-service/${request.userId.userName}`}
                  className="ml-3 font-bold text-emerald-900 hover:underline"
                >
                  {request.userId.userName}
                </Link>
              </div>

              {/* Request Description */}
              <p className="text-gray-300 text-sm">{request.description}</p>

              {/* Display All Request Images in Grid */}
              <div className="grid grid-cols-3 gap-2">
                {request.images.map((image, index) => (
                  <img
                    key={index}
                    src={`${import.meta.env.VITE_BACKEND_URL}${image}`}
                    alt="Request"
                    className="w-16 h-16 object-cover rounded-md border border-gray-600"
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request._id)}
                  className="bg-yellow-400 text-black px-3 py-1 rounded-full hover:bg-yellow-500 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleIgnore(request._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition"
                >
                  Not Interested
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-4">
          No service requests available.
        </p>
      )}
    </div>
  );
};

export default ServiceProviderHome;
