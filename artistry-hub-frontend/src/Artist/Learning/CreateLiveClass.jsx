import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CreateLiveClass = ({
  closeModal,
  isEditing = false,
  liveClassData = null,
}) => {
  const [formData, setFormData] = useState(
    isEditing
      ? {
          className: liveClassData.className,
          description: liveClassData.description,
          artForm: liveClassData.artForm,
          specialization: liveClassData.specialization,
          numberOfClassesPerWeek: liveClassData.numberOfClassesPerWeek,
          classDays: liveClassData.classDays,
          startTime: liveClassData.startTime.split(" ")[0],
          endTime: liveClassData.endTime.split(" ")[0],
          finalEnrollmentDate: new Date(liveClassData.finalEnrollmentDate)
            .toISOString()
            .split("T")[0],
          coverPhoto: null,
          trailerVideo: null,
        }
      : {
          className: "",
          description: "",
          artForm: "",
          specialization: "",
          numberOfClassesPerWeek: 1,
          classDays: [],
          startTime: "",
          endTime: "",
          coverPhoto: null,
          trailerVideo: null,
          finalEnrollmentDate: "",
        }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [errors, setErrors] = useState({});
  const [fileLabels, setFileLabels] = useState({
    coverPhoto: isEditing
      ? "Current cover photo"
      : "Click to upload cover photo",
    trailerVideo: isEditing
      ? "Current trailer video"
      : "Click to upload trailer video",
  });
  const [previews, setPreviews] = useState({
    coverPhoto:
      isEditing && liveClassData.coverPhoto
        ? `${import.meta.env.VITE_BACKEND_URL}${liveClassData.coverPhoto}`
        : null,
    trailerVideo:
      isEditing && liveClassData.trailerVideo
        ? `${import.meta.env.VITE_BACKEND_URL}${liveClassData.trailerVideo}`
        : null,
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchArtForms();
    if (isEditing && liveClassData.artForm) {
      fetchSpecializations(liveClassData.artForm);
    }
  }, [isEditing, liveClassData]);

  const fetchArtForms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/art-forms`
      );
      setArtForms(response.data);
    } catch (error) {
      console.error("Error fetching art forms:", error);
      toast.error("Error fetching art forms");
    }
  };

  const fetchSpecializations = async (selectedArtForm) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/live-classes/art-forms/${selectedArtForm}`
      );
      setSpecializations(response.data);
    } catch (error) {
      console.error("Error fetching specializations:", error);
      toast.error("Error fetching specializations");
    }
  };

  const validateTimes = (start, end) => {
    if (!start || !end) return false;

    // Convert 24h time to minutes since midnight
    const getMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = getMinutes(start);
    const endMinutes = getMinutes(end);

    // Handle case where end time is on the next day
    const durationMinutes =
      endMinutes < startMinutes
        ? endMinutes + 24 * 60 - startMinutes
        : endMinutes - startMinutes;

    return durationMinutes >= 60 && durationMinutes <= 180;
  };

  const formatTimeFor12Hour = (time24h) => {
    if (!time24h) return "";
    const [hours, minutes] = time24h.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const validateClassDays = (days, classesPerWeek) => {
    return days.length === parseInt(classesPerWeek);
  };

  const validateEnrollmentDate = (date) => {
    const enrollmentDate = new Date(date);
    const today = new Date();
    return enrollmentDate > today;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [name]: value,
      };

      // Clear previous errors
      setErrors((prev) => ({ ...prev, [name]: null }));

      // Validate times whenever start or end time changes
      if (name === "startTime" || name === "endTime") {
        const startTimeToValidate =
          name === "startTime" ? value : newData.startTime;
        const endTimeToValidate = name === "endTime" ? value : newData.endTime;

        if (startTimeToValidate && endTimeToValidate) {
          if (!validateTimes(startTimeToValidate, endTimeToValidate)) {
            setErrors((prev) => ({
              ...prev,
              timeRange: "Class duration must be between 1 and 3 hours",
            }));
          } else {
            setErrors((prev) => ({ ...prev, timeRange: null }));
          }
        }
      }

      if (name === "numberOfClassesPerWeek") {
        if (!validateClassDays(prevData.classDays, value)) {
          setErrors((prev) => ({
            ...prev,
            classDays: "Number of selected days must match classes per week",
          }));
        } else {
          setErrors((prev) => ({ ...prev, classDays: null }));
        }
      }

      if (name === "finalEnrollmentDate") {
        if (!validateEnrollmentDate(value)) {
          setErrors((prev) => ({
            ...prev,
            finalEnrollmentDate: "Enrollment date must be in the future",
          }));
        } else {
          setErrors((prev) => ({ ...prev, finalEnrollmentDate: null }));
        }
      }

      if (name === "artForm") {
        fetchSpecializations(value);
        return {
          ...newData,
          specialization: "",
        };
      }

      return newData;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      // Validate cover photo (image files)
      if (name === "coverPhoto") {
        if (!file.type.startsWith("image/")) {
          toast.error("Please upload a valid image file");
          e.target.value = ""; // Reset the input
          return;
        }
        // Replace old preview with new one
        if (previews.coverPhoto) URL.revokeObjectURL(previews.coverPhoto);
        const previewUrl = URL.createObjectURL(file);
        setPreviews((prev) => ({ ...prev, coverPhoto: previewUrl }));
      }

      // Validate trailer video (video files)
      if (name === "trailerVideo") {
        if (!file.type.startsWith("video/")) {
          toast.error("Please upload a valid video file");
          e.target.value = ""; // Reset the input
          return;
        }
        // Replace old preview with new one
        if (previews.trailerVideo) URL.revokeObjectURL(previews.trailerVideo);
        const previewUrl = URL.createObjectURL(file);
        setPreviews((prev) => ({ ...prev, trailerVideo: previewUrl }));
      }

      setFileLabels((prev) => ({
        ...prev,
        [name]: files[0].name,
      }));
      setFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));
    }
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previews.coverPhoto) URL.revokeObjectURL(previews.coverPhoto);
      if (previews.trailerVideo) URL.revokeObjectURL(previews.trailerVideo);
    };
  }, [previews]);

  // Add a useEffect to log the preview URLs for debugging
  useEffect(() => {
    if (isEditing) {
      console.log("Cover Photo URL:", previews.coverPhoto);
      console.log("Trailer Video URL:", previews.trailerVideo);
    }
  }, [isEditing, previews]);

  const handleDayToggle = (day) => {
    setFormData((prevData) => {
      const updatedDays = prevData.classDays.includes(day)
        ? prevData.classDays.filter((d) => d !== day)
        : [...prevData.classDays, day];

      if (!validateClassDays(updatedDays, prevData.numberOfClassesPerWeek)) {
        setErrors((prev) => ({
          ...prev,
          classDays: "Number of selected days must match classes per week",
        }));
      } else {
        setErrors((prev) => ({ ...prev, classDays: null }));
      }

      return {
        ...prevData,
        classDays: updatedDays,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const validationErrors = {};

    if (!validateTimes(formData.startTime, formData.endTime)) {
      validationErrors.timeRange =
        "Class duration must be between 1 and 3 hours";
    }

    if (
      !validateClassDays(formData.classDays, formData.numberOfClassesPerWeek)
    ) {
      validationErrors.classDays =
        "Number of selected days must match classes per week";
    }

    if (!validateEnrollmentDate(formData.finalEnrollmentDate)) {
      validationErrors.finalEnrollmentDate =
        "Enrollment date must be in the future";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      toast.error("Please fix the validation errors");
      return;
    }

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (key === "startTime") {
        formDataToSend.append(key, formatTimeFor12Hour(formData[key]));
      } else if (key === "endTime") {
        formDataToSend.append(key, formatTimeFor12Hour(formData[key]));
      } else if (key === "classDays") {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (key === "coverPhoto" || key === "trailerVideo") {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const response = await axios({
        method: isEditing ? "put" : "post",
        url: `${import.meta.env.VITE_BACKEND_URL}/live-classes${
          isEditing ? `/${liveClassData._id}` : "/create"
        }`,
        data: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        isEditing
          ? "Class updated successfully!"
          : "Class created successfully!"
      );
      closeModal();
    } catch (error) {
      console.error("Error saving live class:", error);
      toast.error("Failed to save live class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-800 p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-auto overflow-y-auto max-h-[90vh]">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6 text-center">
        {isEditing ? "Edit Your Live Class" : "Create Your Live Class"}
      </h2>

      <div className="mb-6 p-4 bg-black/30 rounded-lg border border-yellow-400/20 backdrop-blur-sm">
        <p className="text-yellow-400 font-semibold mb-2">✨ Quick Tips:</p>
        <ul className="text-gray-300 text-sm list-none space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-yellow-400">📝</span> Fill in all details to
            create your class
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-400">⏰</span> Classes run between 1-3
            hours
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-400">🎨</span> Add engaging cover photo
            and trailer
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col">
          <label className="text-gray-300 mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📚</span> Class Name
          </label>
          <input
            type="text"
            name="className"
            value={formData.className}
            onChange={handleChange}
            required
            className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
              focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
            placeholder="e.g., Mastering Watercolor Basics"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-300 mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📝</span> Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
              focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
            placeholder="Describe what students will learn in your class..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🎨</span> Art Form
            </label>
            <select
              name="artForm"
              value={formData.artForm}
              onChange={handleChange}
              required
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50
                [&>option]:bg-zinc-900 [&>option]:text-gray-100"
            >
              <option value="" className="bg-zinc-900 text-gray-400">
                Select Art Form
              </option>
              {artForms.map((artForm) => (
                <option
                  key={artForm._id}
                  value={artForm.artForm}
                  className="bg-zinc-900 text-gray-100"
                >
                  {artForm.artForm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🎯</span> Specialization
            </label>
            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50
                [&>option]:bg-zinc-900 [&>option]:text-gray-100"
            >
              <option value="" className="bg-zinc-900 text-gray-400">
                Select Specialization
              </option>
              {specializations.map((spec, index) => (
                <option
                  key={index}
                  value={spec}
                  className="bg-zinc-900 text-gray-100"
                >
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🔢</span> Classes per Week
            </label>
            <input
              type="number"
              name="numberOfClassesPerWeek"
              value={formData.numberOfClassesPerWeek}
              onChange={handleChange}
              min="1"
              required
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-300 mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📅</span> Class Days
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => handleDayToggle(day)}
                className={`px-3 py-1 rounded-full ${
                  formData.classDays.includes(day)
                    ? "bg-yellow-400 text-black"
                    : "bg-black/30 text-gray-300 border border-yellow-500/20"
                } transition-all duration-300`}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.classDays && (
            <p className="text-red-500 text-sm mt-1">{errors.classDays}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🕐</span> Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300 [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🕒</span> End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300 [color-scheme:dark]"
            />
          </div>
          {errors.timeRange && (
            <p className="text-red-500 text-sm col-span-2">
              {errors.timeRange}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🖼️</span> Cover Photo
            </label>
            <label className="relative group cursor-pointer">
              <input
                type="file"
                name="coverPhoto"
                onChange={handleFileChange}
                accept="image/*"
                required={!isEditing}
                className="hidden"
              />
              <div
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-400
                group-hover:border-yellow-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span className="truncate">{fileLabels.coverPhoto}</span>
                </div>
              </div>
            </label>
            {previews.coverPhoto && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img
                  src={previews.coverPhoto}
                  alt="Cover preview"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🎥</span> Trailer Video
            </label>
            <label className="relative group cursor-pointer">
              <input
                type="file"
                name="trailerVideo"
                onChange={handleFileChange}
                accept="video/*"
                required={!isEditing}
                className="hidden"
              />
              <div
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-400
                group-hover:border-yellow-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span className="truncate">{fileLabels.trailerVideo}</span>
                </div>
              </div>
            </label>
            {previews.trailerVideo && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <video
                  src={previews.trailerVideo}
                  controls
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-300 mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📅</span> Final Enrollment Date
          </label>
          <input
            type="date"
            name="finalEnrollmentDate"
            value={formData.finalEnrollmentDate}
            onChange={handleChange}
            required
            className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
              focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50 [color-scheme:dark]"
          />
          {errors.finalEnrollmentDate && (
            <p className="text-red-500 text-sm mt-1">
              {errors.finalEnrollmentDate}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 
              transition-all duration-300 flex items-center gap-2"
          >
            <span>❌</span> Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg
              hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 flex items-center gap-2"
          >
            {loading ? (
              <span className="loader w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>✨</span> {isEditing ? "Update Class" : "Create Class"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLiveClass;
