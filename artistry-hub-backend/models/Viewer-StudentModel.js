const mongoose = require("mongoose");
const { Schema } = mongoose;

const ViewerStudentSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the student user
    required: true,
  },
  artForm: {
    type: String,
    enum: [
      "Painting",
      "Sculpture",
      "Architecture",
      "Literature",
      "Cinema",
      "Theater",
      "Music",
    ],
    required: true,
  },
  enrolledCourses: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningCourse", // Reference to courses
        required: true,
      },
      progress: {
        type: Number, // Course progress in percentage
        default: 0,
      },
      tickedLessons: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson", // Store lesson IDs that are completed
        },
      ],
      tickedChapters: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapter", // Store chapter IDs that are fully completed
        },
      ],
      certificateIssued: {
        type: Boolean,
        default: false,
      },
      certificateName: String, // Name entered for the certificate
    },
  ],
  completedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningCourse", // Reference to completed courses
    },
  ],
});

module.exports = mongoose.model("ViewerStudent", ViewerStudentSchema);
