import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaCloudUploadAlt } from "react-icons/fa";

const CreateLiveClass = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    className: "",
    artForm: "",
    specialization: "",
    classesPerWeek: "",
    classDays: [],
    startTime: "",
    endTime: "",
    monthlyFee: "",
    maxStudents: "",
    enrollmentDeadline: "",
    coverPhoto: null,
  });

  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchArtForms();
  }, []);

  useEffect(() => {
    if (formData.artForm) {
      fetchSpecializations();
    }
  }, [formData.artForm]);

  const fetchArtForms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/artist/art-forms`
      );
      setArtForms(response.data);
    } catch (error) {
      console.error("Error fetching art forms:", error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/artist/art-forms/${
          formData.artForm
        }`
      );
      setSpecializations(response.data.specializations);
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const validateTimeSlot = () => {
    if (!formData.startTime || !formData.endTime) return true;

    const [startHours, startMinutes] = formData.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = formData.endTime.split(":").map(Number);

    const durationInMinutes =
      endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
    return durationInMinutes >= 60 && durationInMinutes <= 180;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size should be less than 5MB");
        return;
      }

      setFormData({ ...formData, coverPhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateTimeSlot()) {
      alert("Class duration must be between 1 and 3 hours");
      return;
    }

    if (formData.classDays.length !== parseInt(formData.classesPerWeek)) {
      alert("Number of selected days must match classes per week");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "classDays") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === "coverPhoto") {
          if (formData[key]) {
            formDataToSend.append("coverPhoto", formData[key]);
          }
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add schedule object
      formDataToSend.append(
        "schedule",
        JSON.stringify({
          classesPerWeek: parseInt(formData.classesPerWeek),
          classDays: formData.classDays,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: calculateDuration(formData.startTime, formData.endTime),
        })
      );

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/create`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onSuccess(response.data);
    } catch (error) {
      console.error("Error creating live class:", error);
      alert(error.response?.data?.message || "Error creating live class");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-72">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">
            Create Live Class
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo Upload */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">
              Cover Photo <span className="text-yellow-400">*</span>
            </label>
            <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="mx-auto max-h-48 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFormData({ ...formData, coverPhoto: null });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FaCloudUploadAlt className="mx-auto text-4xl text-gray-400" />
                  <div className="text-gray-400">
                    Drag and drop or click to upload
                    <br />
                    <span className="text-sm">(Max size: 5MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Class Name</label>
            <input
              type="text"
              value={formData.className}
              onChange={(e) =>
                setFormData({ ...formData, className: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
              required
            />
          </div>

          {/* Art Form and Specialization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Art Form</label>
              <select
                value={formData.artForm}
                onChange={(e) =>
                  setFormData({ ...formData, artForm: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
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

            <div>
              <label className="block text-gray-300 mb-2">Specialization</label>
              <select
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                required
                disabled={!formData.artForm}
              >
                <option value="">Select Specialization</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Updated Schedule Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-yellow-400">
              Class Schedule
            </h3>

            <div>
              <label className="block text-gray-300 mb-2">
                Classes per Week <span className="text-yellow-400">*</span>
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        classesPerWeek: num.toString(),
                      })
                    }
                    className={`px-4 py-2 rounded-full ${
                      formData.classesPerWeek === num.toString()
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Class Days <span className="text-yellow-400">*</span>
              </label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const currentDays = formData.classDays;
                      const newDays = currentDays.includes(day)
                        ? currentDays.filter((d) => d !== day)
                        : [...currentDays, day];
                      if (newDays.length <= formData.classesPerWeek) {
                        setFormData({ ...formData, classDays: newDays });
                      }
                    }}
                    className={`p-2 rounded-lg text-sm ${
                      formData.classDays.includes(day)
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Select {formData.classesPerWeek} days
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Start Time <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  End Time <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {formData.startTime && formData.endTime && !validateTimeSlot() && (
              <p className="text-red-500 text-sm">
                Class duration must be between 1 and 3 hours
              </p>
            )}
          </div>

          {/* Fees and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">
                Monthly Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyFee}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyFee: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Maximum Students
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({ ...formData, maxStudents: e.target.value })
                }
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Enrollment Deadline
            </label>
            <input
              type="date"
              value={formData.enrollmentDeadline}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentDeadline: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-yellow-500 text-black py-2 rounded-lg ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-400"
            }`}
          >
            {loading ? "Creating..." : "Create Live Class"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLiveClass;
