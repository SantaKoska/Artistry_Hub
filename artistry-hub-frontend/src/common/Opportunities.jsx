import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";

const Opportunities = () => {
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // console.log(selectedItem);
  const [filters, setFilters] = useState({
    artForm: "",
    specialization: "",
    targetAudience: "",
    sortBy: "newest",
  });
  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOpportunities();
    fetchArtForms();
  }, [filters]);

  const fetchArtForms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/student/art-forms`
      );
      setArtForms(response.data);
    } catch (error) {
      console.error("Error fetching art forms:", error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token missing");
        return;
      }

      // Create separate filter objects for jobs and events
      const jobFilters = {
        artForm: filters.artForm || undefined,
        specialization: filters.specialization || undefined,
        targetRole: filters.targetAudience || undefined,
        sortBy: filters.sortBy,
      };

      const eventFilters = {
        artForm: filters.artForm || undefined,
        specialization: filters.specialization || undefined,
        targetAudience: filters.targetAudience || undefined,
        sortBy: filters.sortBy,
      };

      // Remove undefined values
      const validJobFilters = Object.fromEntries(
        Object.entries(jobFilters).filter(([_, value]) => value !== undefined)
      );

      const validEventFilters = Object.fromEntries(
        Object.entries(eventFilters).filter(([_, value]) => value !== undefined)
      );

      const [jobsResponse, eventsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/jobs`, {
          params: validJobFilters,
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/events`, {
          params: validEventFilters,
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setJobs(jobsResponse.data);
      setEvents(eventsResponse.data);
    } catch (error) {
      console.error("Error details:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching opportunities";
      toast.error(errorMessage);
    }
  };

  const handleRegister = async (type, item) => {
    if (item.registrationType === "external") {
      window.open(item.externalLink, "_blank");
      return;
    }

    setSelectedItem({ ...item, type });
    setShowRegistrationModal(true);
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData(e.target);
    const comments = formData.get("comments");

    try {
      const endpoint =
        selectedItem.type === "job"
          ? `/jobs/${selectedItem._id}/apply`
          : `/events/${selectedItem._id}/register`;

      // Create the appropriate payload based on type
      let payload;
      if (selectedItem.type === "job") {
        if (!formData.get("resume")) {
          toast.error("Please upload a resume");
          return;
        }
        payload = formData;
      } else {
        // For events, always send comments (can be empty)
        payload = {
          userDetails: comments || "",
        };
      }

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}${endpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              selectedItem.type === "job"
                ? "multipart/form-data"
                : "application/json",
          },
        }
      );

      toast.success(`Successfully applied for ${selectedItem.type}`);
      setShowRegistrationModal(false);
      fetchOpportunities();
    } catch (error) {
      console.error("Registration error details:", error.response?.data);
      toast.error(
        error.response?.data?.message ||
          `Error applying for ${selectedItem.type}`
      );
    }
  };

  const handleItemClick = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowDetailsModal(true);
  };

  return (
    <div className="bg-slate-900 p-10 shadow-xl backdrop-filter backdrop-blur-md bg-opacity-40 w-full max-w-screen-xl mx-auto mt-16 rounded-xl">
      {/* Filters Section */}
      <div className="mb-8 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.artForm}
            onChange={(e) =>
              setFilters({ ...filters, artForm: e.target.value })
            }
            className="bg-gray-700 rounded p-2"
          >
            <option value="">All Art Forms</option>
            {artForms.map((form) => (
              <option key={form} value={form}>
                {form}
              </option>
            ))}
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="bg-gray-700 rounded p-2"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="closing-soon">Closing Soon</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 rounded ${
            activeTab === "jobs" ? "bg-yellow-400 text-black" : "bg-gray-700"
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded ${
            activeTab === "events" ? "bg-yellow-400 text-black" : "bg-gray-700"
          }`}
        >
          Events
        </button>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === "jobs"
          ? jobs.map((job) => (
              <div
                key={job._id}
                className="bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleItemClick(job, "job")}
              >
                <h3 className="text-xl font-bold mb-2">{job.jobTitle}</h3>
                <p className="text-gray-300 mb-4">{job.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">{job.salary}</span>
                  <button
                    onClick={() => handleRegister("job", job)}
                    className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          : events.map((event) => (
              <div
                key={event._id}
                className="bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => handleItemClick(event, "event")}
              >
                <h3 className="text-xl font-bold mb-2">{event.eventName}</h3>
                <p className="text-gray-300 mb-4">{event.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">
                    {new Date(event.startDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRegister("event", event)}
                    className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}
      </div>

      {/* Details Modal */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Description
                  </h3>
                  <p className="text-gray-300">{selectedItem.description}</p>
                </div>

                {selectedItem.type === "job" && (
                  <>
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
                    </div>
                  </>
                )}

                {selectedItem.type === "event" && (
                  <>
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
                    </div>
                  </>
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

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleRegister(selectedItem.type, selectedItem);
                  }}
                  className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                >
                  {selectedItem.type === "job" ? "Apply Now" : "Register"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onRequestClose={() => setShowRegistrationModal(false)}
        className="modal bg-gray-800 rounded-lg p-8 w-full max-w-2xl mx-auto mt-20"
        overlayClassName="overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {selectedItem?.type === "job"
            ? "Job Application"
            : "Event Registration"}
        </h2>
        <form onSubmit={submitRegistration} className="space-y-4">
          {selectedItem?.type === "job" && (
            <div>
              <label className="block text-sm font-medium mb-1">Resume</label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                className="w-full p-2 rounded bg-gray-700"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Comments
            </label>
            <textarea
              name="comments"
              className="w-full p-2 rounded bg-gray-700"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowRegistrationModal(false)}
              className="px-4 py-2 bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 text-black rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Opportunities;
