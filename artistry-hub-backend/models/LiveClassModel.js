const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    artForm: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    coverPhoto: {
      type: String, // URL to the cover photo
      required: true,
    },
    trailerVideo: {
      type: String, // URL to the trailer video
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfClassesPerWeek: {
      type: Number,
      required: true,
      min: 1, // At least one class per week
    },
    classDays: {
      type: [String], // e.g., ["Monday", "Wednesday"]
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ], // Example enum values
    },
    startTime: {
      type: String, // e.g., "09:00 AM"
      required: true,
    },
    endTime: {
      type: String, // e.g., "10:00 AM"
      required: true,
    },
    finalEnrollmentDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const LiveClass = mongoose.model("LiveClass", liveClassSchema);

module.exports = LiveClass;
