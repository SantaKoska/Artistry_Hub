import React, { useEffect, useState } from "react";
import axios from "axios";

const ServiceProviderHome = () => {
  const [requests, setRequests] = useState([]);
  const [specialization, setSpecialization] = useState("All");
  const [filteredRequests, setFilteredRequests] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/service/requests",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Send token in the Authorization header
            },
            params: {
              specialization, // Send specialization as query param
            },
          }
        );
        setRequests(response.data);
        setFilteredRequests(response.data);
      } catch (error) {
        console.error("Error fetching service requests:", error);
      }
    };

    fetchRequests();
  }, [specialization, token]);

  const handleAccept = async (requestId) => {
    try {
      await axios.post(
        `http://localhost:8000/service/requests/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token when accepting the request
          },
        }
      );
      setRequests(
        (prevRequests) =>
          prevRequests.filter((request) => request._id !== requestId) // Remove the accepted request from the list
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
            Authorization: `Bearer ${token}`, // Include token when ignoring the request
          },
        }
      );
      setRequests(
        (prevRequests) =>
          prevRequests.filter((request) => request._id !== requestId) // Remove the ignored request from the list
      );
    } catch (error) {
      console.error("Error ignoring request:", error);
    }
  };

  const handleSpecializationChange = (event) => {
    setSpecialization(event.target.value); // Update specialization filter
  };

  return (
    <div className="container mx-auto w-full max-w-screen-2xl pt-28 pb-20">
      {/* Filter Section */}
      <div className="flex justify-between mb-6">
        <div>
          <label htmlFor="specialization" className="text-lg font-bold">
            Specialization:
          </label>
          <select
            id="specialization"
            value={specialization}
            onChange={handleSpecializationChange}
            className="ml-2 p-2 border border-gray-300 rounded-md"
          >
            <option value="All">All</option>
            <option value="Painting">Painting</option>
            <option value="Sculpting">Sculpting</option>
            <option value="Photography">Photography</option>
            {/* Add more specializations as needed */}
          </select>
        </div>
      </div>

      {/* Service Requests List */}
      <div className="grid gap-10 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-8"
            >
              <div className="flex items-center mb-4">
                <img
                  src={`http://localhost:8000${request.userId.profilePicture}`}
                  alt={request.userId.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <p className="font-bold text-lg text-emerald-900">
                    {request.userId.userName}
                  </p>
                </div>
              </div>

              {/* Request Images */}
              {request.images.length > 0 && (
                <div className="mb-4">
                  {request.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:8000${image}`}
                      alt="Request"
                      className="w-full h-64 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}

              {/* Request Description */}
              <p className="text-gray-700 mb-4">{request.description}</p>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleAccept(request._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleIgnore(request._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Not Interested
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">
            No service requests available.
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderHome;
