const express = require("express");
const router = express.Router();
const LiveClass = require("../models/LiveClassModel");
const { verifyToken } = require("../utils/tokendec");
const multer = require("multer");
const path = require("path");
const ArtFormSpecialization = require("../models/ArtFormSpecializationModels");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/liveClasses/"); // Destination folder for uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage });

// Create a new live class
router.post(
  "/create",
  verifyToken,
  upload.fields([{ name: "coverPhoto" }, { name: "trailerVideo" }]),
  async (req, res) => {
    try {
      const {
        className,
        description,
        artForm,
        specialization,
        startDate,
        days,
        timeSlots,
        finalEnrollmentDate,
      } = req.body;
      const artistId = req.user.identifier;

      // Validate final enrollment date
      if (new Date(finalEnrollmentDate) < new Date()) {
        return res
          .status(400)
          .json({ message: "Final enrollment date must be in the future." });
      }

      // Validate non-overlapping time slots
      const overlappingClasses = await LiveClass.find({
        artistId,
        startDate,
        days: { $in: days },
      });

      for (const liveClass of overlappingClasses) {
        for (const slot of timeSlots) {
          for (const existingSlot of liveClass.timeSlots) {
            if (slot.day === existingSlot.day) {
              const newStartTime = new Date(`1970-01-01T${slot.slots[0]}:00`);
              const existingStartTime = new Date(
                `1970-01-01T${existingSlot.slots[0]}:00`
              );
              const newEndTime = new Date(
                newStartTime.getTime() + 60 * 60 * 1000
              ); // 1 hour duration
              const existingEndTime = new Date(
                existingStartTime.getTime() + 60 * 60 * 1000
              );

              if (
                newStartTime < existingEndTime &&
                newEndTime > existingStartTime
              ) {
                return res
                  .status(400)
                  .json({
                    message: "Time slots overlap with existing classes.",
                  });
              }
            }
          }
        }
      }

      // Validate art form and specialization
      const artFormSpec = await ArtFormSpecialization.findOne({
        artForm: artForm,
        specializations: { $in: [specialization] },
      });

      if (!artFormSpec) {
        return res
          .status(400)
          .json({ message: "Invalid art form or specialization" });
      }

      // Validate time slots duration
      const totalDuration = timeSlots.reduce((total, slot) => {
        // Assuming each slot represents 1 hour
        return total + slot.slots.length; // Count the number of slots
      }, 0);

      if (totalDuration < 1 || totalDuration > 3) {
        return res
          .status(400)
          .json({ message: "Total duration must be between 1 and 3 hours." });
      }

      const newLiveClass = new LiveClass({
        artistId,
        className,
        description,
        artForm,
        specialization,
        startDate,
        days,
        coverPhoto: `/uploads/liveClasses/${req.files.coverPhoto[0].filename}`,
        trailerVideo: `/uploads/liveClasses/${req.files.trailerVideo[0].filename}`,
        timeSlots: JSON.parse(timeSlots),
        finalEnrollmentDate,
      });

      await newLiveClass.save();
      res.status(201).json(newLiveClass);
    } catch (error) {
      console.error("Error creating live class:", error);
      res.status(500).json({ message: "Error creating live class", error });
    }
  }
);

// Endpoint to get art forms and their specializations
router.get("/art-forms", async (req, res) => {
  try {
    const artForms = await ArtFormSpecialization.find({});
    res.json(artForms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching art forms", error });
  }
});

// Endpoint to get specializations based on art form
router.get("/art-forms/:artForm", async (req, res) => {
  try {
    const artForm = await ArtFormSpecialization.findOne({
      artForm: req.params.artForm,
    });
    if (!artForm) {
      return res.status(404).json({ message: "Art form not found" });
    }
    res.json(artForm.specializations); // Return the specializations array
  } catch (error) {
    res.status(500).json({ message: "Error fetching specializations", error });
  }
});

// Get all live classes
router.get("/", async (req, res) => {
  try {
    const liveClasses = await LiveClass.find().populate("artistId");
    res.status(200).json(liveClasses);
  } catch (error) {
    console.error("Error fetching live classes:", error);
    res.status(500).json({ message: "Error fetching live classes", error });
  }
});

// Enroll in a live class
router.post("/enroll/:id", verifyToken, async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const studentId = req.user.identifier; // Assuming the student's ID is in the token

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found" });
    }

    // Check if the student is already enrolled
    if (liveClass.enrolledStudents.includes(studentId)) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this class" });
    }

    liveClass.enrolledStudents.push(studentId);
    await liveClass.save();

    res
      .status(200)
      .json({ message: "Successfully enrolled in the live class" });
  } catch (error) {
    console.error("Error enrolling in live class:", error);
    res.status(500).json({ message: "Error enrolling in live class", error });
  }
});

module.exports = router;
