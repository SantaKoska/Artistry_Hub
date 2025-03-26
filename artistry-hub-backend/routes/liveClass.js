const express = require("express");
const router = express.Router();
const LiveClass = require("../models/LiveClassModel");
const { verifyToken } = require("../utils/tokendec");
const multer = require("multer");
const path = require("path");
const ArtFormSpecialization = require("../models/ArtFormSpecializationModels");
const { isBefore, addHours } = require("date-fns");
const { sendClassNotification } = require("../utils/mailer");
const schedule = require("node-schedule");
const User = require("../models/UserModel");

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

// Helper function to check if enrollment period is active
const isEnrollmentActive = (enrollmentDate) => {
  const currentDate = new Date();
  const finalDate = new Date(enrollmentDate);

  // Set the final date to end of day (23:59:59)
  finalDate.setHours(23, 59, 59, 999);

  return currentDate <= finalDate;
};

// Helper function to schedule class notifications
const scheduleClassNotifications = async (
  classDate,
  liveClass,
  students,
  artist
) => {
  const classDateTime = new Date(classDate.date);

  // Schedule 24-hour reminder
  const reminder24h = new Date(classDateTime);
  reminder24h.setDate(reminder24h.getDate() - 1);

  // Schedule 15-minute reminder
  const reminder15min = new Date(classDateTime);
  reminder15min.setMinutes(reminder15min.getMinutes() - 15);

  // Schedule notifications for students
  for (const student of students) {
    // 24-hour reminder
    schedule.scheduleJob(reminder24h, async () => {
      await sendClassNotification("classReminder24h", {
        userName: student.userName,
        className: liveClass.className,
        dateTime: classDateTime,
        artistName: artist.userName,
        email: student.email,
      });
    });

    // 15-minute reminder
    schedule.scheduleJob(reminder15min, async () => {
      const classLink = `${process.env.FRONTEND_URL}/live-class-room/${liveClass._id}?role=student`;
      await sendClassNotification("classReminder15min", {
        userName: student.userName,
        className: liveClass.className,
        dateTime: classDateTime,
        artistName: artist.userName,
        classLink,
        email: student.email,
      });
    });
  }

  // Schedule notifications for artist
  schedule.scheduleJob(reminder24h, async () => {
    await sendClassNotification("classReminder24h", {
      userName: artist.userName,
      className: liveClass.className,
      dateTime: classDateTime,
      artistName: "your students",
      email: artist.email,
    });
  });

  schedule.scheduleJob(reminder15min, async () => {
    const classLink = `${process.env.FRONTEND_URL}/live-class-room/${liveClass._id}?role=artist`;
    await sendClassNotification("classReminder15min", {
      userName: artist.userName,
      className: liveClass.className,
      dateTime: classDateTime,
      artistName: "your students",
      classLink,
      email: artist.email,
    });
  });
};

// Helper function to update class statuses and generate new dates
const updateClassStatuses = async (liveClass) => {
  let needsSave = false;
  const now = new Date();

  // Sort class dates by date
  const sortedDates = liveClass.classDates.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Update completed classes and find last scheduled class
  let lastScheduledDate = null;
  sortedDates.forEach((classDate) => {
    if (classDate.status === "scheduled" && new Date(classDate.date) < now) {
      classDate.status = "completed";
      needsSave = true;
    }
    if (classDate.status === "scheduled") {
      lastScheduledDate = new Date(classDate.date);
    }
  });

  // Count upcoming scheduled classes
  const upcomingClasses = sortedDates.filter(
    (date) => date.status === "scheduled" && new Date(date.date) > now
  );

  // Generate new class dates if we have less than 4 upcoming classes
  if (lastScheduledDate && upcomingClasses.length < 4) {
    const startDate = new Date(lastScheduledDate);
    startDate.setDate(startDate.getDate() + 1);

    // Calculate how many new dates we need
    const neededDates = 4 - upcomingClasses.length;

    // Generate new dates until we have 4 upcoming classes
    let newDates = [];
    while (newDates.length < neededDates) {
      const nextDates = liveClass.generateNextClassDates(startDate);
      if (nextDates.length === 0) break;

      newDates.push(nextDates[0]);
      startDate.setDate(startDate.getDate() + 7); // Move start date forward by a week
    }

    if (newDates.length > 0) {
      liveClass.classDates.push(...newDates);
      needsSave = true;
    }
  }

  // Remove extra upcoming classes if we somehow have more than 4
  const allUpcomingClasses = liveClass.classDates
    .filter((date) => date.status === "scheduled" && new Date(date.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allUpcomingClasses.length > 4) {
    const extraClasses = allUpcomingClasses.slice(4);
    liveClass.classDates = liveClass.classDates.filter(
      (date) => !extraClasses.find((extra) => extra._id.equals(date._id))
    );
    needsSave = true;
  }

  if (needsSave) {
    await liveClass.save();
  }

  return liveClass;
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

      // Generate initial class dates
      const initialClassDates = newLiveClass.generateNextClassDates();
      newLiveClass.classDates = initialClassDates;

      // Schedule notifications for initial class dates
      const artist = await User.findById(artistId);
      for (const classDate of initialClassDates) {
        await scheduleClassNotifications(classDate, newLiveClass, [], artist);
      }

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
    let liveClasses = await LiveClass.find({ artistId })
      .populate("artistId")
      .populate("enrolledStudents", "userName profilePicture");

    // Update class statuses for each class
    liveClasses = await Promise.all(
      liveClasses.map((liveClass) => updateClassStatuses(liveClass))
    );

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

    let liveClasses = await LiveClass.find({
      enrolledStudents: { $ne: studentId },
      finalEnrollmentDate: { $gt: currentDate },
    }).populate({
      path: "artistId",
      select: "userName profilePicture bio email",
    });

    // Update class statuses for each class
    liveClasses = await Promise.all(
      liveClasses.map((liveClass) => updateClassStatuses(liveClass))
    );

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
    let liveClasses = await LiveClass.find({
      enrolledStudents: studentId,
    }).populate({
      path: "artistId",
      select: "userName profilePicture bio email",
    });

    // Update class statuses for each class
    liveClasses = await Promise.all(
      liveClasses.map((liveClass) => updateClassStatuses(liveClass))
    );

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
    if (!isEnrollmentActive(liveClass.finalEnrollmentDate)) {
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
    if (!isEnrollmentActive(liveClass.finalEnrollmentDate)) {
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
    if (!isEnrollmentActive(liveClass.finalEnrollmentDate)) {
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
      if (!isEnrollmentActive(liveClass.finalEnrollmentDate)) {
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

      // Regenerate class dates if classDays or times have changed
      if (classDays || startTime || endTime) {
        const tempClass = new LiveClass({
          ...liveClass.toObject(),
          ...updateData,
        });
        updateData.classDates = tempClass.generateNextClassDates();
      }

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

// Update the cancel class route
router.post("/cancel-class/:classId/:dateId", verifyToken, async (req, res) => {
  try {
    const { classId, dateId } = req.params;
    const liveClass = await LiveClass.findById(classId)
      .populate("artistId")
      .populate("enrolledStudents");

    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found" });
    }

    // Find the specific class date
    const classDate = liveClass.classDates.id(dateId);
    if (!classDate) {
      return res.status(404).json({ message: "Class date not found" });
    }

    // Check if trying to cancel less than 24 hours before
    const classDateTime = new Date(classDate.date);
    if (isBefore(classDateTime, addHours(new Date(), 24))) {
      return res.status(400).json({
        message:
          "Classes cannot be cancelled less than 24 hours before start time",
      });
    }

    // Mark the class as cancelled
    classDate.status = "cancelled";

    // Get all future scheduled dates (including the one being cancelled)
    const cancelledDateTime = new Date(classDate.date).getTime();
    const scheduledDates = liveClass.classDates
      .filter(
        (d) =>
          d.status === "scheduled" &&
          new Date(d.date).getTime() > cancelledDateTime
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (scheduledDates.length > 0) {
      // There are future scheduled dates, generate from the last one
      const lastScheduledDate = new Date(
        scheduledDates[scheduledDates.length - 1].date
      );
      const startDate = new Date(lastScheduledDate);
      startDate.setDate(startDate.getDate() + 1);
      const newDates = liveClass.generateNextClassDates(startDate);
      if (newDates.length > 0) {
        liveClass.classDates.push(newDates[0]);
      }
    } else {
      // No future scheduled dates, generate from the cancelled date
      const startDate = new Date(cancelledDateTime);
      startDate.setDate(startDate.getDate() + 7); // Add a week to ensure we get the next valid class day
      const newDates = liveClass.generateNextClassDates(startDate);
      if (newDates.length > 0) {
        liveClass.classDates.push(newDates[0]);
      }
    }

    // Send cancellation email to the artist
    await sendClassNotification("classCancellation", {
      userName: liveClass.artistId.userName,
      className: liveClass.className,
      dateTime: classDate.date,
      artistName: "your",
      reason: req.body.reason,
      email: liveClass.artistId.email,
    });

    // Send cancellation emails to all enrolled students
    for (const student of liveClass.enrolledStudents) {
      await sendClassNotification("classCancellation", {
        userName: student.userName,
        className: liveClass.className,
        dateTime: classDate.date,
        artistName: liveClass.artistId.userName,
        reason: req.body.reason,
        email: student.email,
      });
    }

    await liveClass.save();
    res.json({ message: "Class cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling class:", error);
    res.status(500).json({ message: "Error cancelling class", error });
  }
});

// Update the reschedule class route
router.post(
  "/reschedule-class/:classId/:dateId",
  verifyToken,
  async (req, res) => {
    try {
      const { classId, dateId } = req.params;
      const { newStartTime, newEndTime } = req.body;
      const liveClass = await LiveClass.findById(classId)
        .populate("artistId")
        .populate("enrolledStudents");

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      // Find the specific class date
      const classDate = liveClass.classDates.id(dateId);
      if (!classDate) {
        return res.status(404).json({ message: "Class date not found" });
      }

      // Check if trying to reschedule less than 24 hours before
      const classDateTime = new Date(classDate.date);
      if (isBefore(classDateTime, addHours(new Date(), 24))) {
        return res.status(400).json({
          message:
            "Classes cannot be rescheduled less than 24 hours before start time",
        });
      }

      // Validate time range (1-3 hours)
      const startMinutes = getMinutesFrom12Hour(newStartTime);
      const endMinutes = getMinutesFrom12Hour(newEndTime);
      const durationMinutes =
        endMinutes < startMinutes
          ? endMinutes + 24 * 60 - startMinutes
          : endMinutes - startMinutes;

      if (durationMinutes < 60 || durationMinutes > 180) {
        return res.status(400).json({
          message: "Class duration must be between 1 and 3 hours",
        });
      }

      // Update the class time
      const newDate = new Date(classDate.date);
      const [newHours, newMinutes] = newStartTime.split(":").map(Number);
      newDate.setHours(newHours);
      newDate.setMinutes(newMinutes);

      const oldDateTime = new Date(classDate.date);
      classDate.date = newDate;
      classDate.startTime = newStartTime;
      classDate.endTime = newEndTime;

      // Send rescheduling email to the artist
      await sendClassNotification("classRescheduled", {
        userName: liveClass.artistId.userName,
        className: liveClass.className,
        oldDateTime: oldDateTime,
        newDateTime: newDate,
        artistName: "your students",
        email: liveClass.artistId.email,
      });

      // Send rescheduling emails to all enrolled students
      for (const student of liveClass.enrolledStudents) {
        await sendClassNotification("classRescheduled", {
          userName: student.userName,
          className: liveClass.className,
          oldDateTime: oldDateTime,
          newDateTime: newDate,
          artistName: liveClass.artistId.userName,
          email: student.email,
        });
      }

      await liveClass.save();
      res.json({
        message: "Class rescheduled successfully",
        updatedClass: liveClass,
      });
    } catch (error) {
      console.error("Error rescheduling class:", error);
      res.status(500).json({ message: "Error rescheduling class", error });
    }
  }
);

module.exports = router;
