import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CreateJobModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    description: "",
    lastDate: "",
    targetRole: "both",
    artForm: "",
    specialization: "",
    salary: "",
    location: {
      postalCode: "",
      district: "",
      state: "",
      country: "",
    },
    jobType: "full-time",
    registrationType: "internal",
    externalLink: "",
  });

  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    fetchArtForms();
  }, []);

  const fetchArtForms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/common-things/art-forms`
      );
      setArtForms(response.data);
    } catch (error) {
      toast.error("Error fetching art forms");
    }
  };

  const handleArtFormChange = async (selectedArtForm) => {
    setFormData({ ...formData, artForm: selectedArtForm, specialization: "" });
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/common-things/specializations/${selectedArtForm}`
      );
      setSpecializations(response.data);
    } catch (error) {
      toast.error("Error fetching specializations");
    }
  };

  const fetchLocationData = async (postalCode) => {
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
      if (
        response.data &&
        response.data[0] &&
        response.data[0].Status === "Success"
      ) {
        const place = response.data[0].PostOffice[0];
        setFormData((prevData) => ({
          ...prevData,
          location: {
            ...prevData.location,
            district: place.District,
            state: place.State,
            country: "India",
            postalCode: postalCode,
          },
        }));
      } else {
        toast.error("Invalid postal code");
      }
    } catch (error) {
      toast.error("Error fetching location data");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.jobTitle || formData.jobTitle.length < 3) {
      errors.jobTitle = "Job title must be at least 3 characters";
    }

    if (!formData.description || formData.description.length < 20) {
      errors.description = "Description must be at least 20 characters";
    }

    const today = new Date();
    const lastDate = new Date(formData.lastDate);
    if (lastDate <= today) {
      errors.lastDate = "Last date must be in the future";
    }

    return Object.keys(errors).length === 0 ? null : errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors) {
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }

    if (formData.registrationType === "external" && !formData.externalLink) {
      toast.error("External link is required for external registration");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/jobs/create`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Job created successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating job");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2 text-yellow-400">
          Create New Job
        </h2>

        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-yellow-400">
          <p className="text-yellow-400 font-semibold mb-2">
            Important Reminder:
          </p>
          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
            <li>Please review all fields carefully before submission</li>
            <li>Job details cannot be modified after creation</li>
            <li>For external jobs, application data will not be available</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              rows="4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Last Date to Apply
            </label>
            <input
              type="date"
              value={formData.lastDate}
              onChange={(e) =>
                setFormData({ ...formData, lastDate: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Target Role
            </label>
            <select
              value={formData.targetRole}
              onChange={(e) =>
                setFormData({ ...formData, targetRole: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            >
              <option value="both">Both</option>
              <option value="artist">Artist</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Art Form
            </label>
            <select
              value={formData.artForm}
              onChange={(e) => handleArtFormChange(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            >
              <option value="">Select Art Form</option>
              {artForms.map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>

          {formData.artForm && (
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Specialization
              </label>
              <select
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
              >
                <option value="">Select Specialization</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Salary
            </label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) =>
                setFormData({ ...formData, salary: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="e.g., $50,000 - $70,000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.location.postalCode}
              onChange={(e) => {
                const postalCode = e.target.value;
                if (postalCode.length === 6) {
                  fetchLocationData(postalCode);
                }
                setFormData({
                  ...formData,
                  location: { ...formData.location, postalCode },
                });
              }}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              District
            </label>
            <input
              type="text"
              value={formData.location.district}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              State
            </label>
            <input
              type="text"
              value={formData.location.state}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Country
            </label>
            <input
              type="text"
              value={formData.location.country}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Job Type
            </label>
            <select
              value={formData.jobType}
              onChange={(e) =>
                setFormData({ ...formData, jobType: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Registration Type
            </label>
            <select
              value={formData.registrationType}
              onChange={(e) =>
                setFormData({ ...formData, registrationType: e.target.value })
              }
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              required
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>

          {formData.registrationType === "external" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                External Link
              </label>
              <input
                type="url"
                value={formData.externalLink}
                onChange={(e) =>
                  setFormData({ ...formData, externalLink: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition-colors"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;
