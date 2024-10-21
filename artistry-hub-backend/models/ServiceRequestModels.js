const mongoose = require("mongoose");

const ServiceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the user who made the request
      required: true,
    },
    artForm: {
      type: String,
      required: true,
    },
    specialization: {
      type: String, // Add the specialization field for filtering purposes
      required: false, // Set to true if you want to make it mandatory
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    serviceProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted"], // Track the status of the request
      default: "Pending", // Default to "Pending"
    },
  },
  { timestamps: true }
);

const ServiceRequest = mongoose.model("ServiceRequest", ServiceRequestSchema);

module.exports = ServiceRequest;
