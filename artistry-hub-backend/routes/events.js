const express = require("express");
const router = express.Router();
const multer = require("multer");
const Event = require("../models/EventModel");
const { verifyToken } = require("../utils/tokendec");
const Job = require("../models/JobModel");

// Configure multer for poster uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "events/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Add validation middleware
const validateEvent = (req, res, next) => {
  const { eventName, description, startDate, lastRegistrationDate } = req.body;

  // Basic validation
  if (!eventName || eventName.length < 3) {
    return res
      .status(400)
      .json({ message: "Event name must be at least 3 characters" });
  }
  if (!description || description.length < 20) {
    return res
      .status(400)
      .json({ message: "Description must be at least 20 characters" });
  }

  // Date validation
  const today = new Date();
  const startDateObj = new Date(startDate);
  const lastRegDateObj = new Date(lastRegistrationDate);

  if (lastRegDateObj <= today) {
    return res
      .status(400)
      .json({ message: "Registration end date must be in the future" });
  }
  if (startDateObj <= lastRegDateObj) {
    return res.status(400).json({
      message: "Event start date must be after registration end date",
    });
  }

  next();
};

// Create new event
router.post(
  "/create",
  verifyToken,
  upload.array("posters", 5),
  validateEvent,
  async (req, res) => {
    try {
      // Validate poster files
      if (req.files) {
        const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        const invalidFile = req.files.find(
          (file) => !validImageTypes.includes(file.mimetype)
        );
        if (invalidFile) {
          return res
            .status(400)
            .json({ message: "Only JPEG, PNG and JPG images are allowed" });
        }
      }

      const {
        eventName,
        description,
        startDate,
        lastRegistrationDate,
        targetAudience,
        artForm,
        specialization,
        registrationType,
        externalLink,
      } = req.body;

      const posters = req.files
        ? req.files.map((file) => `/events/${file.filename}`)
        : [];

      const event = new Event({
        institutionId: req.user.identifier,
        eventName,
        description,
        startDate,
        lastRegistrationDate,
        targetAudience,
        artForm,
        specialization,
        registrationType,
        externalLink,
        posters,
      });

      await event.save();
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Error creating event", error });
    }
  }
);

// Get all events (with filters)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { targetAudience, artForm, specialization } = req.query;

    let query = {
      lastRegistrationDate: { $gte: new Date() }, // Only show active events
    };

    if (targetAudience) {
      query.targetAudience = { $in: [targetAudience, "both"] };
    }

    if (artForm) {
      query.artForm = artForm;
    }

    if (specialization) {
      query.specialization = specialization;
    }

    const events = await Event.find(query)
      .populate({
        path: "institutionId",
        select: "userName profilePicture",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(events);
  } catch (error) {
    console.error("Error in /events route:", error);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
});

// Get institution's events with statistics
router.get("/institution", verifyToken, async (req, res) => {
  try {
    const events = await Event.find({
      institutionId: req.user.identifier,
    }).sort({ createdAt: -1 });

    const statistics = events.map((event) => ({
      eventName: event.eventName,
      totalRegistrations: event.registrations.length,
      registrationsByDate: event.registrations.reduce((acc, reg) => {
        const date = reg.registrationDate.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    }));

    res.json({ events, statistics });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching institution events", error });
  }
});

// Register for an event
router.post("/:eventId/register", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    // Additional validations
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (new Date(event.lastRegistrationDate) < new Date()) {
      return res
        .status(400)
        .json({ message: "Event registration period has expired" });
    }

    // Check if user has already registered
    const alreadyRegistered = event.registrations.some(
      (reg) => reg.userId.toString() === req.user.identifier
    );
    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ message: "You have already registered for this event" });
    }

    // Validate user details if required
    if (event.registrationType === "internal" && !req.body.userDetails) {
      return res.status(400).json({ message: "User details are required" });
    }

    event.registrations.push({
      userId: req.user.identifier,
      userDetails: req.body.userDetails,
    });

    await event.save();
    res.json({ message: "Successfully registered for event" });
  } catch (error) {
    res.status(500).json({ message: "Error registering for event", error });
  }
});

// Add cleanup route for expired events/jobs (to be called via cron job)
router.post("/cleanup", async (req, res) => {
  try {
    const today = new Date();

    // Archive expired events
    await Event.updateMany(
      { lastRegistrationDate: { $lt: today } },
      { $set: { status: "expired" } }
    );

    // Archive expired jobs
    await Job.updateMany(
      { lastDate: { $lt: today } },
      { $set: { status: "expired" } }
    );

    res.json({ message: "Cleanup completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during cleanup", error });
  }
});

// Add this route to events.js
router.get(
  "/:eventId/registrations/download",
  verifyToken,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId).populate({
        path: "registrations.userId",
        select: "userName email",
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if user is the event creator
      if (event.institutionId.toString() !== req.user.identifier) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      // Create CSV content
      const csvRows = ["Username,Email,Registration Date,Additional Details"];
      event.registrations.forEach((reg) => {
        csvRows.push(
          `${reg.userId.userName},${
            reg.userId.email
          },${reg.registrationDate.toISOString()},${reg.userDetails || "N/A"}`
        );
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${event.eventName}_registrations.csv`
      );
      res.send(csvRows.join("\n"));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error downloading registrations", error });
    }
  }
);

module.exports = router;
