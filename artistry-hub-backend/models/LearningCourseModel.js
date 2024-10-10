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
    chapters: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        lessons: [
          {
            title: String,
            description: String,
            mediaUrl: String, // URL to the video file
            noteUrl: {
              type: String,
              default: "", // url to the PDF note
            },
          },
        ],
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
