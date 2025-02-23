import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CreateLiveClass = ({ closeModal }) => {
  const [formData, setFormData] = useState({
    className: "",
    description: "",
    artForm: "",
    specialization: "",
    startDate: "",
    days: [],
    coverPhoto: null,
    trailerVideo: null,
    finalEnrollmentDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const [timeSlots, setTimeSlots] = useState([{ day: "", slots: [""] }]);
  const [artForms, setArtForms] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    fetchArtForms();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "artForm") {
      fetchSpecializations(value);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files[0],
    }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    if (field === "day") {
      updatedSlots[index].day = value;
    } else {
      updatedSlots[index].slots[0] = value;
    }
    setTimeSlots(updatedSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: "", slots: [""] }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formDataToSend = new FormData();
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }
    formDataToSend.append("timeSlots", JSON.stringify(timeSlots));

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/live-classes/create`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Live class created successfully!");
      closeModal();
    } catch (error) {
      console.error("Error creating live class:", error);
      toast.error("Error creating live class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-800 p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-auto overflow-y-auto max-h-[90vh]">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6 text-center">
        Create Your Live Class
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
                focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
            >
              <option value="">Select Art Form</option>
              {artForms.map((artForm) => (
                <option key={artForm._id} value={artForm.artForm}>
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
                focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
            >
              <option value="">Select Specialization</option>
              {specializations.map((spec, index) => (
                <option key={index} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">📅</span> Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">📆</span> Class Days
            </label>
            <div className="flex flex-wrap gap-2">
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
                    const updatedDays = formData.days.includes(day)
                      ? formData.days.filter((d) => d !== day)
                      : [...formData.days, day];
                    setFormData({ ...formData, days: updatedDays });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300
                    ${
                      formData.days.includes(day)
                        ? "bg-yellow-400 text-black"
                        : "bg-black/30 text-gray-300 border border-yellow-500/20"
                    }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🖼️</span> Cover Photo
            </label>
            <div className="relative">
              <input
                type="file"
                name="coverPhoto"
                onChange={handleFileChange}
                accept="image/*"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-400
                hover:border-yellow-500/50 transition-all duration-300 text-center"
              >
                Click to upload cover photo
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 flex items-center gap-2">
              <span className="text-yellow-400">🎥</span> Trailer Video
            </label>
            <div className="relative">
              <input
                type="file"
                name="trailerVideo"
                onChange={handleFileChange}
                accept="video/*"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-400
                hover:border-yellow-500/50 transition-all duration-300 text-center"
              >
                Click to upload trailer video
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-300 mb-2 flex items-center gap-2">
            <span className="text-yellow-400">📅</span> Final Enrollment Date
          </label>
          <input
            type="date"
            name="finalEnrollmentDate"
            onChange={handleChange}
            required
            className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
              focus:border-yellow-500 focus:outline-none transition-all duration-300 hover:border-yellow-500/50"
          />
        </div>

        <div>
          <h3 className="text-gray-300 mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⏰</span> Time Slots
          </h3>
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-4 mb-4">
              <select
                value={slot.day}
                onChange={(e) =>
                  handleTimeSlotChange(index, "day", e.target.value)
                }
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                  focus:border-yellow-500 focus:outline-none transition-all duration-300"
                required
              >
                <option value="">Select Day</option>
                {formData.days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={slot.slots[0]}
                onChange={(e) =>
                  handleTimeSlotChange(index, "slot", e.target.value)
                }
                className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 text-gray-100
                  focus:border-yellow-500 focus:outline-none transition-all duration-300"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 flex items-center gap-2"
          >
            <span>➕</span> Add Another Time Slot
          </button>
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
                <span>✨</span> Create Class
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLiveClass;
