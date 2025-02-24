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
    // Sanitize filename by removing special characters and spaces
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, "_") // Replace special chars with underscore
      .replace(/\s+/g, "_"); // Replace spaces with underscore
    cb(null, `${Date.now()}-${sanitizedName}`); // Unique filename
  },
});

const upload = multer({ storage });

// Helper function to convert 12-hour time to minutes
const getMinutesFrom12Hour = (time12h) => {
  const [time, period] = time12h.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

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
        numberOfClassesPerWeek,
        classDays,
        startTime,
        endTime,
        finalEnrollmentDate,
      } = req.body;
      const artistId = req.user.identifier;

      // Parse classDays from JSON string to array
      const parsedClassDays = JSON.parse(classDays);

      // Validate class days
      if (parsedClassDays.length !== parseInt(numberOfClassesPerWeek)) {
        return res.status(400).json({
          message:
            "Number of selected days must match number of classes per week",
        });
      }

      // Validate time range (1-3 hours)
      const startMinutes = getMinutesFrom12Hour(startTime);
      const endMinutes = getMinutesFrom12Hour(endTime);

      // Handle case where end time is on the next day
      const durationMinutes =
        endMinutes < startMinutes
          ? endMinutes + 24 * 60 - startMinutes
          : endMinutes - startMinutes;

      if (durationMinutes < 60 || durationMinutes > 180) {
        return res.status(400).json({
          message: "Class duration must be between 1 and 3 hours",
        });
      }

      // Validate enrollment date
      if (new Date(finalEnrollmentDate) <= new Date()) {
        return res.status(400).json({
          message: "Final enrollment date must be in the future",
        });
      }

      // Validate art form and specialization
      const artFormSpec = await ArtFormSpecialization.findOne({
        artForm: artForm,
        specializations: { $in: [specialization] },
      });

      if (!artFormSpec) {
        return res.status(400).json({
          message: "Invalid art form or specialization",
        });
      }

      const newLiveClass = new LiveClass({
        artistId,
        className,
        description,
        artForm,
        specialization,
        coverPhoto: `/uploads/liveClasses/${req.files.coverPhoto[0].filename}`,
        trailerVideo: `/uploads/liveClasses/${req.files.trailerVideo[0].filename}`,
        numberOfClassesPerWeek: parseInt(numberOfClassesPerWeek),
        classDays: parsedClassDays,
        startTime,
        endTime,
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

// Get all live classes for artists (their own classes)
router.get("/artist", verifyToken, async (req, res) => {
  try {
    const artistId = req.user.identifier;
    const liveClasses = await LiveClass.find({ artistId }).populate("artistId");
    res.status(200).json(liveClasses);
  } catch (error) {
    console.error("Error fetching artist's live classes:", error);
    res.status(500).json({ message: "Error fetching live classes", error });
  }
});

// Get all live classes for students (excluding enrolled classes)
router.get("/student/available", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.identifier;
    const currentDate = new Date();

    const liveClasses = await LiveClass.find({
      enrolledStudents: { $ne: studentId },
      finalEnrollmentDate: { $gt: currentDate }, // Only show classes with future enrollment dates
    }).populate("artistId");
    res.status(200).json(liveClasses);
  } catch (error) {
    console.error("Error fetching available live classes:", error);
    res.status(500).json({ message: "Error fetching live classes", error });
  }
});

// Get enrolled live classes for students
router.get("/student/enrolled", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.identifier;
    const liveClasses = await LiveClass.find({
      enrolledStudents: studentId,
    }).populate("artistId");
    res.status(200).json(liveClasses);
  } catch (error) {
    console.error("Error fetching enrolled live classes:", error);
    res.status(500).json({ message: "Error fetching enrolled classes", error });
  }
});

// Enroll in a live class
router.post("/enroll/:id", verifyToken, async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const studentId = req.user.identifier;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found" });
    }

    // Check if enrollment date has passed
    if (new Date() > new Date(liveClass.finalEnrollmentDate)) {
      return res.status(400).json({
        message: "Enrollment period has ended for this class",
      });
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

// Unenroll from a live class
router.post("/unenroll/:id", verifyToken, async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const studentId = req.user.identifier;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found" });
    }

    // Check if enrollment date has passed
    if (new Date() > new Date(liveClass.finalEnrollmentDate)) {
      return res.status(400).json({
        message: "Cannot unenroll after the enrollment deadline",
      });
    }

    // Check if the student is enrolled
    if (!liveClass.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: "Not enrolled in this class" });
    }

    // Remove student from enrolledStudents array
    liveClass.enrolledStudents = liveClass.enrolledStudents.filter(
      (id) => id.toString() !== studentId.toString()
    );
    await liveClass.save();

    res
      .status(200)
      .json({ message: "Successfully unenrolled from the live class" });
  } catch (error) {
    console.error("Error unenrolling from live class:", error);
    res
      .status(500)
      .json({ message: "Error unenrolling from live class", error });
  }
});

// Delete a live class
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found" });
    }

    // Check if enrollment date has passed
    if (new Date() > new Date(liveClass.finalEnrollmentDate)) {
      return res.status(400).json({
        message: "Cannot delete class after enrollment deadline",
      });
    }

    // Verify that the user is the owner of the class
    if (liveClass.artistId.toString() !== req.user.identifier) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this class" });
    }

    await LiveClass.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Live class deleted successfully" });
  } catch (error) {
    console.error("Error deleting live class:", error);
    res.status(500).json({ message: "Error deleting live class", error });
  }
});

// Update a live class
router.put(
  "/:id",
  verifyToken,
  upload.fields([{ name: "coverPhoto" }, { name: "trailerVideo" }]),
  async (req, res) => {
    try {
      const liveClass = await LiveClass.findById(req.params.id);

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      // Check if enrollment date has passed
      if (new Date() > new Date(liveClass.finalEnrollmentDate)) {
        return res.status(400).json({
          message: "Cannot edit class after enrollment deadline",
        });
      }

      // Verify that the user is the owner of the class
      if (liveClass.artistId.toString() !== req.user.identifier) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this class" });
      }

      const {
        className,
        description,
        artForm,
        specialization,
        numberOfClassesPerWeek,
        classDays,
        startTime,
        endTime,
        finalEnrollmentDate,
      } = req.body;

      // Parse classDays from JSON string to array if it exists
      const parsedClassDays = classDays
        ? JSON.parse(classDays)
        : liveClass.classDays;

      // Validate class days
      if (
        parsedClassDays.length !==
        parseInt(numberOfClassesPerWeek || liveClass.numberOfClassesPerWeek)
      ) {
        return res.status(400).json({
          message:
            "Number of selected days must match number of classes per week",
        });
      }

      // Validate time range (1-3 hours)
      const startMinutes = getMinutesFrom12Hour(
        startTime || liveClass.startTime
      );
      const endMinutes = getMinutesFrom12Hour(endTime || liveClass.endTime);

      const durationMinutes =
        endMinutes < startMinutes
          ? endMinutes + 24 * 60 - startMinutes
          : endMinutes - startMinutes;

      if (durationMinutes < 60 || durationMinutes > 180) {
        return res.status(400).json({
          message: "Class duration must be between 1 and 3 hours",
        });
      }

      // Validate enrollment date if provided
      if (finalEnrollmentDate && new Date(finalEnrollmentDate) <= new Date()) {
        return res.status(400).json({
          message: "Final enrollment date must be in the future",
        });
      }

      // Validate art form and specialization if provided
      if (artForm && specialization) {
        const artFormSpec = await ArtFormSpecialization.findOne({
          artForm: artForm,
          specializations: { $in: [specialization] },
        });

        if (!artFormSpec) {
          return res.status(400).json({
            message: "Invalid art form or specialization",
          });
        }
      }

      const updateData = {
        className: className || liveClass.className,
        description: description || liveClass.description,
        artForm: artForm || liveClass.artForm,
        specialization: specialization || liveClass.specialization,
        numberOfClassesPerWeek:
          parseInt(numberOfClassesPerWeek) || liveClass.numberOfClassesPerWeek,
        classDays: parsedClassDays,
        startTime: startTime || liveClass.startTime,
        endTime: endTime || liveClass.endTime,
        finalEnrollmentDate:
          finalEnrollmentDate || liveClass.finalEnrollmentDate,
      };

      // Add new files if they exist
      if (req.files?.coverPhoto) {
        updateData.coverPhoto = `/uploads/liveClasses/${req.files.coverPhoto[0].filename}`;
      }
      if (req.files?.trailerVideo) {
        updateData.trailerVideo = `/uploads/liveClasses/${req.files.trailerVideo[0].filename}`;
      }

      const updatedLiveClass = await LiveClass.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.status(200).json(updatedLiveClass);
    } catch (error) {
      console.error("Error updating live class:", error);
      res.status(500).json({ message: "Error updating live class", error });
    }
  }
);

module.exports = router;
