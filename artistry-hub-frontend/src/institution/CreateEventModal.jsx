import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiUpload, FiX } from "react-icons/fi";

const CreateEventModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    startDate: "",
    lastRegistrationDate: "",
    targetAudience: "both",
    artForm: "",
    specialization: "",
    registrationType: "internal",
    externalLink: "",
  });

  const [posters, setPosters] = useState([]);
  const [posterPreviews, setPosterPreviews] = useState([]);
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

  const validateForm = () => {
    const errors = {};

    if (!formData.eventName || formData.eventName.length < 3) {
      errors.eventName = "Event name must be at least 3 characters";
    }

    if (!formData.description || formData.description.length < 20) {
      errors.description = "Description must be at least 20 characters";
    }

    const today = new Date();
    const startDate = new Date(formData.startDate);
    const lastRegistrationDate = new Date(formData.lastRegistrationDate);

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    } else if (startDate <= today) {
      errors.startDate = "Start date must be in the future";
    }

    if (!formData.lastRegistrationDate) {
      errors.lastRegistrationDate = "Last registration date is required";
    } else if (lastRegistrationDate <= today) {
      errors.lastRegistrationDate =
        "Last registration date must be in the future";
    }

    if (startDate <= lastRegistrationDate) {
      errors.startDate = "Event start date must be after registration end date";
    }

    if (!formData.artForm) {
      errors.artForm = "Art form is required";
    }

    if (formData.artForm && !formData.specialization) {
      errors.specialization = "Specialization is required";
    }

    if (formData.registrationType === "external" && !formData.externalLink) {
      errors.externalLink =
        "External link is required for external registration";
    }

    if (formData.registrationType === "external" && formData.externalLink) {
      try {
        new URL(formData.externalLink);
      } catch (e) {
        errors.externalLink = "Please enter a valid URL";
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  };

  const validatePosters = (files) => {
    const errors = [];
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        errors.push(
          `${file.name} is not a valid image type. Only JPG, JPEG and PNG are allowed.`
        );
      }
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large. Maximum size is 5MB.`);
      }
    });

    return errors;
  };

  const handlePosterUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + posters.length > 5) {
      toast.error("Maximum 5 posters allowed");
      return;
    }

    const posterErrors = validatePosters(files);
    if (posterErrors.length > 0) {
      posterErrors.forEach((error) => toast.error(error));
      return;
    }

    setPosters([...posters, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPosterPreviews([...posterPreviews, ...newPreviews]);
  };

  const removePoster = (index) => {
    const newPosters = posters.filter((_, i) => i !== index);
    const newPreviews = posterPreviews.filter((_, i) => i !== index);
    setPosters(newPosters);
    setPosterPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors) {
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      posters.forEach((poster) => {
        formDataToSend.append("posters", poster);
      });

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/events/create`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Event created successfully");
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error creating event";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2 text-yellow-400">
          Create New Event
        </h2>

        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-yellow-400">
          <p className="text-yellow-400 font-semibold mb-2">
            Important Reminder:
          </p>
          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
            <li>Please review all fields carefully before submission</li>
            <li>Event details cannot be modified after creation</li>
            <li>Only event posters can be edited or deleted later</li>
            <li>
              For external events, registration data will not be available
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Event Name
            </label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) =>
                setFormData({ ...formData, eventName: e.target.value })
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Last Registration Date
              </label>
              <input
                type="date"
                value={formData.lastRegistrationDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastRegistrationDate: e.target.value,
                  })
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Target Audience
            </label>
            <select
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
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

          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Event Posters
            </label>
            <div className="mt-2 flex flex-wrap gap-4">
              {posterPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Poster ${index + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePoster(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <FiX className="text-white" />
                  </button>
                </div>
              ))}
              {posters.length < 5 && (
                <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-400 rounded cursor-pointer hover:border-yellow-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="hidden"
                    multiple
                  />
                  <FiUpload className="text-gray-400 text-2xl" />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Upload up to 5 posters (optional)
            </p>
          </div>

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
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
