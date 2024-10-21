import React, { useEffect, useState } from "react";
import axios from "axios";

const ServiceProviderHome = () => {
  const [requests, setRequests] = useState([]);
  const [specialization, setSpecialization] = useState("All");
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const token = localStorage.getItem("token");
  const [userArtForm, setUserArtForm] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/service/requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              specialization,
            },
          }
        );

        setRequests(response.data.requests); // Access requests from the response object
        setFilteredRequests(response.data.requests);

        // Set userArtForm based on the first request, if available
        if (response.data.requests.length > 0) {
          const artForm = response.data.artform; // Get artForm from the response
          setUserArtForm(artForm);
        }
      } catch (error) {
        console.error("Error fetching service requests:", error);
      }
    };

    fetchRequests();
  }, [specialization, token]);

  useEffect(() => {
    const fetchSpecializations = async () => {
      if (userArtForm) {
        try {
          const response = await axios.get(
            `http://localhost:8000/common-things/specializations/${userArtForm}`
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
        `http://localhost:8000/service/requests/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request._id !== requestId)
      );
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleIgnore = async (requestId) => {
    try {
      await axios.post(
        `http://localhost:8000/service/requests/${requestId}/ignore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request._id !== requestId)
      );
    } catch (error) {
      console.error("Error ignoring request:", error);
    }
  };

  const handleSpecializationChange = (event) => {
    setSpecialization(event.target.value);
  };

  return (
    <div className="p-8">
      {/* Filter Section */}
      <div className="flex justify-between items-center mb-6 p-6 bg-gray-800 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg bg-opacity-30">
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
          className="ml-4 p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent text-black
         transition"
        >
          <option value="All">All</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Service Requests List */}
      <div className="grid gap-10 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 mb-8 transition-transform transform hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <img
                  src={`http://localhost:8000${request.userId.profilePicture}`}
                  alt={request.userId.userName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500"
                />
                <div className="ml-4">
                  <p className="font-bold text-lg text-yellow-400">
                    {request.userId.userName}
                  </p>
                </div>
              </div>

              {/* Request Images */}
              {request.images.length > 0 && (
                <div className="mb-4 grid grid-cols-1 gap-2">
                  {request.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:8000${image}`}
                      alt="Request"
                      className="w-full h-64 object-cover rounded-md border border-gray-600"
                    />
                  ))}
                </div>
              )}

              {/* Request Description */}
              <p className="text-gray-300 mb-4">{request.description}</p>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleAccept(request._id)}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-full hover:bg-yellow-500 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleIgnore(request._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
                >
                  Not Interested
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 col-span-full">
            No service requests available.
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderHome;
