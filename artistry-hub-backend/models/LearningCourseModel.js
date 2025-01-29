// LearningCourseSchema.js
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
    artForm: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
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
    certificateSerials: [
      {
        _id: false,
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ViewerStudent",
          required: true,
        },
        serialNumber: {
          type: String,
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create a unique index on serialNumber with conditions
LearningCourseSchema.index(
  { "certificateSerials.serialNumber": 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      "certificateSerials.serialNumber": { $exists: true, $ne: null },
    },
  }
);

// Create the model
const LearningCourse = mongoose.model("LearningCourse", LearningCourseSchema);

// After model is created, handle the index
async function setupIndexes() {
  try {
    // Drop the old index if it exists
    await LearningCourse.collection
      .dropIndex("certificateSerials.serialNumber_1")
      .catch(() => {
        // Ignore error if index doesn't exist
      });
  } catch (error) {
    // Ignore any errors during index dropping
  }
}

// Call setupIndexes but don't wait for it
setupIndexes();

module.exports = LearningCourse;
