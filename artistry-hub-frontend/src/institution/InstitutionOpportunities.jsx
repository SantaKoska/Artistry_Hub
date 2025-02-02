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

                <button
                  onClick={() => downloadRegistrantsData(selectedItem)}
                  className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                >
                  Download{" "}
                  {selectedItem.type === "job" ? "Applicants" : "Registrants"}{" "}
                  Data
                </button>
              </div>
            </div>
          </div>
        )}
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
