const mongoose = require("mongoose");

const LiveClassSchema = new mongoose.Schema(
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
    specialization: {
      type: String,
      required: true,
    },
    schedule: {
      classesPerWeek: {
        type: Number,
        required: true,
      },
      classDays: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
      ],
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      duration: {
        type: Number, // in minutes
        required: true,
      },
    },
    monthlyFee: {
      type: Number,
      required: true,
    },
    enrollmentDeadline: {
      type: Date,
      required: true,
    },
    maxStudents: {
      type: Number,
      required: true,
    },
    enrolledStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        lastPaymentDate: Date,
        nextPaymentDue: Date,
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
    classRecordings: [
      {
        date: Date,
        youtubeVideoId: String,
        materials: [
          {
            title: String,
            fileUrl: String,
            uploadDate: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    coverPhotoUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Add index for efficient querying
LiveClassSchema.index({ artistId: 1, status: 1 });
LiveClassSchema.index({ "enrolledStudents.studentId": 1 });

// Middleware to check for time slot conflicts
LiveClassSchema.pre("save", async function (next) {
  if (this.isModified("schedule")) {
    const conflictingClass = await this.constructor.findOne({
      artistId: this.artistId,
      _id: { $ne: this._id },
      status: "active",
      "schedule.classDays": { $in: this.schedule.classDays },
      $or: [
        {
          "schedule.startTime": {
            $lt: this.schedule.endTime,
            $gte: this.schedule.startTime,
          },
        },
        {
          "schedule.endTime": {
            $gt: this.schedule.startTime,
            $lte: this.schedule.endTime,
          },
        },
      ],
    });

    if (conflictingClass) {
      throw new Error("Time slot conflicts with another class");
    }
  }
  next();
});

const LiveClass = mongoose.model("LiveClass", LiveClassSchema);

module.exports = LiveClass;
