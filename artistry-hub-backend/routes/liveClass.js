const express = require("express");
const router = express.Router();
const LiveClass = require("../models/LiveClassModel");
const LiveClassPayment = require("../models/LiveClassPaymentModel");
const LiveClassAttendance = require("../models/LiveClassAttendanceModel");
const { verifyToken } = require("../utils/tokendec");
const multer = require("multer");
const path = require("path");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/live-classes"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
});

// Create a new live class
router.post(
  "/create",
  verifyToken,
  upload.single("coverPhoto"),
  async (req, res) => {
    try {
      const {
        className,
        artForm,
        specialization,
        schedule,
        monthlyFee,
        enrollmentDeadline,
        maxStudents,
      } = req.body;

      const newClass = new LiveClass({
        artistId: req.user.identifier,
        className,
        artForm,
        specialization,
        schedule: JSON.parse(schedule),
        monthlyFee,
        enrollmentDeadline: new Date(enrollmentDeadline),
        maxStudents,
        coverPhotoUrl: req.file
          ? `/uploads/live-classes/${req.file.filename}`
          : null,
      });

      // Validation will automatically check for time conflicts
      await newClass.save();
      res.status(201).json(newClass);
    } catch (error) {
      if (error.message === "Time slot conflicts with another class") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating live class:", error);
      res
        .status(500)
        .json({ message: "Error creating live class", error: error.message });
    }
  }
);

// Get all live classes for an artist
router.get("/artist-classes", verifyToken, async (req, res) => {
  try {
    const classes = await LiveClass.find({
      artistId: req.user.identifier,
      status: { $ne: "cancelled" },
    }).populate("enrolledStudents.studentId", "userName profilePicture");

    res.json(classes);
  } catch (error) {
    console.error("Error fetching artist classes:", error);
    res
      .status(500)
      .json({ message: "Error fetching classes", error: error.message });
  }
});

// Get available classes for students
router.get("/available-classes", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      status: "active",
      enrollmentDeadline: { $gte: today },
      $expr: {
        $lt: [{ $size: "$enrolledStudents" }, "$maxStudents"],
      },
      // Exclude classes where student is already enrolled
      "enrolledStudents.studentId": { $ne: req.user.identifier },
    };

    const classes = await LiveClass.find(query)
      .populate({
        path: "artistId",
        select: "userName profilePicture posts",
      })
      .lean();

    res.json(classes);
  } catch (error) {
    console.error("Error fetching available classes:", error);
    res.status(500).json({
      message: "Error fetching classes",
      error: error.message,
    });
  }
});

// Add new endpoint for filtered classes
router.get("/search-classes", verifyToken, async (req, res) => {
  try {
    const { search, artForm, maxFee, daysOfWeek, classesPerWeek } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = {
      status: "active",
      enrollmentDeadline: { $gte: today },
      $expr: { $lt: [{ $size: "$enrolledStudents" }, "$maxStudents"] },
      "enrolledStudents.studentId": { $ne: req.user.identifier },
    };

    // Add search condition
    if (search) {
      query.$or = [
        { className: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    // Add art form filter
    if (artForm) {
      query.artForm = artForm;
    }

    // Add maximum fee filter
    if (maxFee) {
      query.monthlyFee = { $lte: parseInt(maxFee) };
    }

    // Add days filter
    if (daysOfWeek) {
      const days = daysOfWeek.split(",");
      query["schedule.classDays"] = { $in: days };
    }

    // Add classes per week filter
    if (classesPerWeek) {
      query["schedule.classesPerWeek"] = parseInt(classesPerWeek);
    }

    const classes = await LiveClass.find(query)
      .populate({
        path: "artistId",
        select: "userName profilePicture posts",
      })
      .lean();

    res.json(classes);
  } catch (error) {
    console.error("Error searching classes:", error);
    res.status(500).json({
      message: "Error searching classes",
      error: error.message,
    });
  }
});

// Enroll in a class
router.post("/enroll/:classId", verifyToken, async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.classId);

    if (!liveClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Set deadline to end of the specified day
    const deadlineDate = new Date(liveClass.enrollmentDeadline);
    deadlineDate.setHours(23, 59, 59, 999);

    if (new Date() > deadlineDate) {
      return res
        .status(400)
        .json({ message: "Enrollment deadline has passed" });
    }

    if (liveClass.enrolledStudents.length >= liveClass.maxStudents) {
      return res.status(400).json({ message: "Class is full" });
    }

    const alreadyEnrolled = liveClass.enrolledStudents.some(
      (student) => student.studentId.toString() === req.user.identifier
    );

    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this class" });
    }

    liveClass.enrolledStudents.push({
      studentId: req.user.identifier,
      enrollmentDate: new Date(),
      lastPaymentDate: new Date(),
      nextPaymentDue: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

    await liveClass.save();
    res.json(liveClass);
  } catch (error) {
    console.error("Error enrolling in class:", error);
    res
      .status(500)
      .json({ message: "Error enrolling in class", error: error.message });
  }
});

// Start a class session
router.post("/start-session/:classId", verifyToken, async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({
      _id: req.params.classId,
      artistId: req.user.identifier,
    });

    if (!liveClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Generate a unique meeting ID
    const meetingId = `${liveClass._id}-${Date.now()}`;

    // You can integrate with a video platform API here (e.g., Zoom, Jitsi, etc.)
    const meetingUrl = `https://meet.jit.si/${meetingId}`; // Using Jitsi as an example

    const session = new LiveClassAttendance({
      classId: liveClass._id,
      date: new Date(),
      startTime: new Date(),
      status: "ongoing",
      joinUrl: meetingUrl,
      endTime: null,
    });

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error starting class session:", error);
    res
      .status(500)
      .json({ message: "Error starting session", error: error.message });
  }
});

// Get active session for a class
router.get("/active-session/:classId", verifyToken, async (req, res) => {
  try {
    const session = await LiveClassAttendance.findOne({
      classId: req.params.classId,
      status: "ongoing",
    });

    res.json(session);
  } catch (error) {
    console.error("Error fetching active session:", error);
    res
      .status(500)
      .json({ message: "Error fetching session", error: error.message });
  }
});

// Record student attendance
router.post("/record-attendance/:sessionId", verifyToken, async (req, res) => {
  try {
    const session = await LiveClassAttendance.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const attendance = {
      studentId: req.user.identifier,
      joinTime: new Date(),
    };

    session.attendees.push(attendance);
    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error recording attendance:", error);
    res
      .status(500)
      .json({ message: "Error recording attendance", error: error.message });
  }
});

// End class session
router.post("/end-session/:sessionId", verifyToken, async (req, res) => {
  try {
    const session = await LiveClassAttendance.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.endTime = new Date();
    session.status = "completed";

    // Calculate duration for each attendee
    session.attendees.forEach((attendee) => {
      if (!attendee.leaveTime) {
        attendee.leaveTime = new Date();
      }
      attendee.duration = Math.round(
        (attendee.leaveTime - attendee.joinTime) / 1000 / 60
      );
    });

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error ending session:", error);
    res
      .status(500)
      .json({ message: "Error ending session", error: error.message });
  }
});

// Process monthly payment
router.post("/process-payment/:classId", verifyToken, async (req, res) => {
  try {
    const { razorpayPaymentId, amount } = req.body;
    const liveClass = await LiveClass.findById(req.params.classId);

    if (!liveClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const commission = amount * 0.1; // 10% commission
    const artistEarnings = amount - commission;

    const payment = new LiveClassPayment({
      classId: liveClass._id,
      studentId: req.user.identifier,
      artistId: liveClass.artistId,
      amount,
      commission,
      artistEarnings,
      razorpayPaymentId,
      status: "completed",
      periodStart: new Date(),
      periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

    await payment.save();

    // Update student's payment status in live class
    const studentEnrollment = liveClass.enrolledStudents.find(
      (student) => student.studentId.toString() === req.user.identifier
    );

    if (studentEnrollment) {
      studentEnrollment.lastPaymentDate = new Date();
      studentEnrollment.nextPaymentDue = new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      );
      await liveClass.save();
    }

    res.json(payment);
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ message: "Error processing payment", error: error.message });
  }
});

// Get enrolled classes for a student
router.get("/enrolled-classes", verifyToken, async (req, res) => {
  try {
    const classes = await LiveClass.find({
      "enrolledStudents.studentId": req.user.identifier,
      status: { $ne: "cancelled" },
    }).populate("artistId", "userName profilePicture");

    res.json(classes);
  } catch (error) {
    console.error("Error fetching enrolled classes:", error);
    res.status(500).json({
      message: "Error fetching enrolled classes",
      error: error.message,
    });
  }
});

// Get sessions for a student
router.get("/:classId/student-sessions", verifyToken, async (req, res) => {
  try {
    const classId = req.params.classId;
    const studentId = req.user.identifier;

    // First check if student is enrolled in the class
    const liveClass = await LiveClass.findOne({
      _id: classId,
      "enrolledStudents.studentId": studentId,
    });

    if (!liveClass) {
      return res.status(403).json({ message: "Not enrolled in this class" });
    }

    // Get sessions for this class
    const sessions = await LiveClassAttendance.find({
      classId: classId,
      $or: [
        { status: "ongoing" },
        {
          status: "completed",
          "attendees.studentId": studentId,
        },
      ],
    }).sort({ startTime: -1 });

    // Format sessions with join URLs for ongoing sessions
    const formattedSessions = sessions.map((session) => ({
      _id: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      joinUrl: session.status === "ongoing" ? session.joinUrl : null,
      // Only include attendance data for completed sessions
      attendance:
        session.status === "completed"
          ? session.attendees.find((a) => a.studentId.toString() === studentId)
          : null,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    res.status(500).json({ message: "Error fetching sessions" });
  }
});

module.exports = router;
