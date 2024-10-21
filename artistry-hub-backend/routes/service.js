const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/ServiceRequestModels");
const ServiceProvider = require("../models/ServiceProviderModels");

// Authentication
const { verifyToken } = require("../utils/tokendec");

// Get all service requests based on the service provider's expertise and filtering by specialization
router.get("/requests", verifyToken, async (req, res) => {
  const { specialization } = req.query;
  const user = req.user; // Extracted from the token

  try {
    // Find the service provider's expertise based on the user ID from the token
    const serviceProvider = await ServiceProvider.findOne({
      userId: user.identifier,
    });

    if (!serviceProvider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    // Build the query based on the expertise and specialization
    const query = {
      artForm: serviceProvider.expertise, // Filter by the expertise of the service provider
      status: "Pending", // Only show pending requests
      serviceProviderId: { $eq: null }, // Only show requests not yet accepted by any provider
    };

    if (specialization && specialization !== "All") {
      query.specialization = specialization; // Add specialization filter if provided
    }

    const requests = await ServiceRequest.find(query).populate(
      "userId",
      "userName profilePicture"
    );

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service requests", error });
  }
});

// Accept a service request
router.post("/requests/:requestId/accept", verifyToken, async (req, res) => {
  const user = req.user; // Extracted from the token
  const { requestId } = req.params;

  try {
    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Assign the service provider to the request
    serviceRequest.serviceProviderId = user.identifier; // Use identifier from the token
    serviceRequest.status = "Accepted";

    await serviceRequest.save();
    res.json({ message: "Service request accepted" });
  } catch (error) {
    res.status(500).json({ message: "Error accepting service request", error });
  }
});

// Ignore a service request (mark it as ignored so it doesn't show up again)
router.post("/requests/:requestId/ignore", verifyToken, async (req, res) => {
  const { requestId } = req.params;

  try {
    const serviceRequest = await ServiceRequest.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    // Mark the service provider as not interested
    serviceRequest.status = "Ignored";
    await serviceRequest.save();

    res.json({ message: "Service request ignored" });
  } catch (error) {
    res.status(500).json({ message: "Error ignoring service request", error });
  }
});

module.exports = router;
