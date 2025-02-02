const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  lastRegistrationDate: {
    type: Date,
    required: true,
  },
  targetAudience: {
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
  registrationType: {
    type: String,
    enum: ["internal", "external"],
    required: true,
  },
  externalLink: {
    type: String,
  },
  posters: [
    {
      type: String, // Array of poster image paths
    },
  ],
  registrations: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      registrationDate: {
        type: Date,
        default: Date.now,
      },
      userDetails: {
        type: Map,
        of: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", EventSchema);
