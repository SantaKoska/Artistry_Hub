const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  lastDate: {
    type: Date,
    required: true,
  },
  targetRole: {
    type: String,
    enum: ["both", "artist", "student"],
    required: true,
  },
  artForm: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
  },
  salary: {
    type: String,
  },
  location: {
    address: String,
    district: String,
    state: String,
    country: String,
    postalCode: {
      type: String,
      required: true,
    },
  },
  jobType: {
    type: String,
    enum: ["full-time", "part-time", "contract", "internship"],
    required: true,
  },
  registrationType: {
    type: String,
    enum: ["internal", "external"],
    required: true,
  },
  externalLink: {
    type: String,
  },
  applications: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      applicationDate: {
        type: Date,
        default: Date.now,
      },
      resume: {
        type: String, // Path to uploaded resume
      },
      status: {
        type: String,
        enum: ["pending", "reviewed", "accepted", "rejected"],
        default: "pending",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Job", JobSchema);
