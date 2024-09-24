const mongoose = require("mongoose");

const LearningCourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Professional"],
      required: true,
    },
    videos: [
      {
        title: String,
        description: String,
        mediaUrl: String, // URL to the video file
        note: {
          type: String,
          default: "", // Optional note for the video
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledNumber: {
      type: Number,
      default: 0,
    },
    enrolledIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const LearningCourse = mongoose.model("LearningCourse", LearningCourseSchema);

module.exports = LearningCourse;
