import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";
import { toast } from "react-toastify";
import CreateJobModal from "./CreateJobModal";
import CreateEventModal from "./CreateEventModal";
import Modal from "react-modal";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const InstitutionOpportunities = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobStats, setJobStats] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showEditPosters, setShowEditPosters] = useState(false);
  const [newPosters, setNewPosters] = useState([]);
  const [posterPreviews, setPosterPreviews] = useState([]);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem("token");
      const [jobsResponse, eventsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs/institution`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/events/institution`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setJobs(jobsResponse.data.jobs);
      setJobStats(jobsResponse.data.statistics);
      setEvents(eventsResponse.data.events);
      setEventStats(eventsResponse.data.statistics);
    } catch (error) {
      toast.error("Error fetching opportunities");
    }
  };

  const renderJobsChart = (jobData) => {
    if (!jobData.applicationsByDate) return null;

    const data = {
      labels: Object.keys(jobData.applicationsByDate),
      datasets: [
        {
          label: "Applications",
          data: Object.values(jobData.applicationsByDate),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };

    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{jobData.jobTitle}</h3>
        <Line data={data} />
      </div>
    );
  };

  const renderEventsChart = (eventData) => {
    if (!eventData.registrationsByDate) return null;

    const data = {
      labels: Object.keys(eventData.registrationsByDate),
      datasets: [
        {
          label: "Registrations",
          data: Object.values(eventData.registrationsByDate),
          borderColor: "rgb(153, 102, 255)",
          tension: 0.1,
        },
      ],
    };

    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{eventData.eventName}</h3>
        <Line data={data} />
      </div>
    );
  };

  const downloadRegistrantsData = async (item) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        item.type === "job"
          ? `/jobs/${item._id}/applications/download`
          : `/events/${item._id}/registrations/download`;

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${
          item.type === "job" ? item.jobTitle : item.eventName
        }_registrants.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Error downloading data");
    }
  };

  const handleItemClick = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowDetailsModal(true);
  };

  const handlePosterUpload = (e) => {
    const files = Array.from(e.target.files);
    const currentPosters = selectedItem?.posters?.length || 0;

    if (files.length + currentPosters > 5) {
      toast.error("Maximum 5 posters allowed");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      toast.error("Only JPG/PNG files under 5MB are allowed");
      return;
    }

    setNewPosters([...newPosters, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPosterPreviews([...posterPreviews, ...newPreviews]);
  };

  const handleDeletePoster = async (index) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/events/${
          selectedItem._id
        }/posters/${index}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedItem = { ...selectedItem };
      updatedItem.posters.splice(index, 1);
      setSelectedItem(updatedItem);
      toast.success("Poster deleted successfully");
    } catch (error) {
      toast.error("Error deleting poster");
    }
  };

  const handleSavePosters = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      newPosters.forEach((poster) => {
        formData.append("posters", poster);
      });

      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/events/${
          selectedItem._id
        }/posters`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSelectedItem({ ...selectedItem, posters: response.data.posters });
      setNewPosters([]);
      setPosterPreviews([]);
      setShowEditPosters(false);
      toast.success("Posters updated successfully");
    } catch (error) {
      toast.error("Error updating posters");
    }
  };

  const handleDelete = async (item, type) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = type === "job" ? "jobs" : "events";

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/${endpoint}/${item._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state to remove the deleted item
      if (type === "job") {
        setJobs(jobs.filter((job) => job._id !== item._id));
      } else {
        setEvents(events.filter((event) => event._id !== item._id));
      }

      setShowConfirmDelete(false);
      setShowDetailsModal(false);
      toast.success(`${type === "job" ? "Job" : "Event"} deleted successfully`);
    } catch (error) {
      toast.error(`Error deleting ${type}`);
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Opportunities Management
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowCreateJobModal(true)}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Create Job
          </button>
          <button
            onClick={() => setShowCreateEventModal(true)}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Create Event
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "jobs"
                ? "bg-yellow-400 text-black"
                : "bg-gray-700 text-white"
            }`}
            onClick={() => setActiveTab("jobs")}
          >
            Jobs
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === "events"
                ? "bg-yellow-400 text-black"
                : "bg-gray-700 text-white"
            }`}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
        </div>

        {activeTab === "jobs" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer hover:bg-gray-700"
                  onClick={() => handleItemClick(job, "job")}
                >
                  <h3 className="text-xl font-bold mb-2">{job.jobTitle}</h3>
                  <p className="text-gray-300 mb-4">{job.description}</p>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Applications: {job.applications.length}</span>
                    <span>
                      Last Date: {new Date(job.lastDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">
                Application Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobStats.map((stat) => (
                  <div key={stat.jobId || stat.jobTitle}>
                    {renderJobsChart(stat)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer hover:bg-gray-700"
                  onClick={() => handleItemClick(event, "event")}
                >
                  <h3 className="text-xl font-bold mb-2">{event.eventName}</h3>
                  <p className="text-gray-300 mb-4">{event.description}</p>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Registrations: {event.registrations.length}</span>
                    <span>
                      Start Date:{" "}
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">
                Registration Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventStats.map((stat) => (
                  <div key={stat.eventId || stat.eventName}>
                    {renderEventsChart(stat)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDetailsModal}
        onRequestClose={() => setShowDetailsModal(false)}
        className="modal bg-gray-800 rounded-lg p-8 w-full max-w-3xl mx-auto mt-20"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold">
                {selectedItem.type === "job"
                  ? selectedItem.jobTitle
                  : selectedItem.eventName}
              </h2>
              <div className="flex space-x-2">
                {selectedItem.type === "event" && (
                  <button
                    onClick={() => setShowEditPosters(true)}
                    className="text-yellow-400 hover:text-yellow-500"
                  >
                    <FiEdit2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-red-500 hover:text-red-600"
                >
                  <FiTrash2 size={20} />
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Description
                  </h3>
                  <p className="text-gray-300">{selectedItem.description}</p>
                </div>

                {selectedItem.type === "job" && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400">
                      Details
                    </h3>
                    <p className="text-gray-300">
                      Salary: {selectedItem.salary}
                    </p>
                    <p className="text-gray-300">
                      Location: {selectedItem.location}
                    </p>
                    <p className="text-gray-300">
                      Job Type: {selectedItem.jobType}
                    </p>
                    <p className="text-gray-300">
                      Last Date:{" "}
                      {new Date(selectedItem.lastDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300">
                      Total Applications: {selectedItem.applications?.length}
                    </p>
                  </div>
                )}

                {selectedItem.type === "event" && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400">
                      Event Details
                    </h3>
                    <p className="text-gray-300">
                      Start Date:{" "}
                      {new Date(selectedItem.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300">
                      Registration Deadline:{" "}
                      {new Date(
                        selectedItem.lastRegistrationDate
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300">
                      Target Audience: {selectedItem.targetAudience}
                    </p>
                    <p className="text-gray-300">
                      Total Registrations: {selectedItem.registrations?.length}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Category
                  </h3>
                  <p className="text-gray-300">
                    Art Form: {selectedItem.artForm}
                  </p>
                  <p className="text-gray-300">
                    Specialization: {selectedItem.specialization}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedItem.type === "event" &&
                  selectedItem.posters &&
                  selectedItem.posters.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                        Event Posters
                      </h3>
                      <div className="space-y-2">
                        {selectedItem.posters.map((poster, index) => (
                          <img
                            key={index}
                            src={`${import.meta.env.VITE_BACKEND_URL}${poster}`}
                            alt={`Event poster ${index + 1}`}
                            className="w-full rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {selectedItem &&
                  selectedItem.registrationType !== "external" && (
                    <button
                      onClick={() => downloadRegistrantsData(selectedItem)}
                      className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                    >
                      Download{" "}
                      {selectedItem.type === "job"
                        ? "Applicants"
                        : "Registrants"}{" "}
                      Data
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditPosters}
        onRequestClose={() => {
          setShowEditPosters(false);
          setNewPosters([]);
          setPosterPreviews([]);
        }}
        className="modal bg-gray-800 rounded-lg p-8 w-full max-w-2xl mx-auto mt-20"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-yellow-400">
              Edit Event Posters
            </h2>
            <button
              onClick={() => {
                setShowEditPosters(false);
                setNewPosters([]);
                setPosterPreviews([]);
              }}
              className="text-gray-400 hover:text-white"
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

          <div>
            <h3 className="text-lg font-semibold mb-2">Current Posters</h3>
            <div className="grid grid-cols-3 gap-4">
              {selectedItem?.posters?.map((poster, index) => (
                <div key={index} className="relative">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${poster}`}
                    alt={`Event poster ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => handleDeletePoster(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <FiTrash2 className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Add New Posters</h3>
            <div className="grid grid-cols-3 gap-4">
              {posterPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`New poster ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    onClick={() => {
                      setNewPosters(newPosters.filter((_, i) => i !== index));
                      setPosterPreviews(
                        posterPreviews.filter((_, i) => i !== index)
                      );
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <FiTrash2 className="text-white" />
                  </button>
                </div>
              ))}
              {(selectedItem?.posters?.length || 0) + newPosters.length < 5 && (
                <label className="border-2 border-dashed border-gray-400 rounded flex items-center justify-center h-32 cursor-pointer hover:border-yellow-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="hidden"
                    multiple
                  />
                  <span className="text-gray-400">+ Add Poster</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowEditPosters(false);
                setNewPosters([]);
                setPosterPreviews([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePosters}
              className="px-4 py-2 bg-yellow-400 text-black rounded"
              disabled={newPosters.length === 0}
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmDelete}
        onRequestClose={() => setShowConfirmDelete(false)}
        className="modal bg-gray-800 rounded-lg p-8 w-full max-w-md mx-auto mt-20"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
        <p className="mb-6">
          Are you sure you want to delete this {selectedItem?.type}? This action
          cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowConfirmDelete(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleDelete(selectedItem, selectedItem.type);
              setShowDetailsModal(false);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Delete
          </button>
        </div>
      </Modal>

      {showCreateJobModal && (
        <CreateJobModal
          onClose={() => setShowCreateJobModal(false)}
          onSuccess={() => {
            setShowCreateJobModal(false);
            fetchOpportunities();
          }}
        />
      )}

      {showCreateEventModal && (
        <CreateEventModal
          onClose={() => setShowCreateEventModal(false)}
          onSuccess={() => {
            setShowCreateEventModal(false);
            fetchOpportunities();
          }}
        />
      )}
    </div>
  );
};

export default InstitutionOpportunities;
