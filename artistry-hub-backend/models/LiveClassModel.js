const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    classDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["scheduled", "cancelled", "completed"],
          default: "scheduled",
        },
      },
    ],
  },
  { timestamps: true }
);

// Add a method to generate next 4 class dates
liveClassSchema.methods.generateNextClassDates = function (
  startFromDate = new Date()
) {
  const dates = [];
  let currentDate = new Date(startFromDate);
  const daysMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  while (dates.length < 4) {
    if (this.classDays.includes(Object.keys(daysMap)[currentDate.getDay()])) {
      dates.push({
        date: new Date(currentDate),
        status: "scheduled",
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const LiveClass = mongoose.model("LiveClass", liveClassSchema);

module.exports = LiveClass;
