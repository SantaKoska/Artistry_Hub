const mongoose = require("mongoose");

const LiveClassAttendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    attendees: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinTime: Date,
        leaveTime: Date,
        duration: Number, // in minutes
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    recordingUrl: String,
    cancellationReason: String,
    joinUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
LiveClassAttendanceSchema.index({ classId: 1, date: 1 });
LiveClassAttendanceSchema.index({ "attendees.studentId": 1 });

const LiveClassAttendance = mongoose.model(
  "LiveClassAttendance",
  LiveClassAttendanceSchema
);

module.exports = LiveClassAttendance;
