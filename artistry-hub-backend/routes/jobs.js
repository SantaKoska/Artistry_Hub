const express = require("express");
const router = express.Router();
const multer = require("multer");
const Job = require("../models/JobModel");
const { verifyToken } = require("../utils/tokendec");

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "resumes/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Add validation middleware
const validateJob = (req, res, next) => {
  const { jobTitle, description, lastDate, salary, location, jobType } =
    req.body;

  // Basic validation
  if (!jobTitle || jobTitle.length < 3) {
    return res
      .status(400)
      .json({ message: "Job title must be at least 3 characters" });
  }
  if (!description || description.length < 20) {
    return res
      .status(400)
      .json({ message: "Description must be at least 20 characters" });
  }

  // Validate dates
  const today = new Date();
  const lastDateObj = new Date(lastDate);
  if (lastDateObj <= today) {
    return res.status(400).json({ message: "Last date must be in the future" });
  }

  // Validate salary format (optional if salary can be negotiable)
  if (salary && !salary.match(/^[\$\d,\s\-]+$/)) {
    return res.status(400).json({ message: "Invalid salary format" });
  }

  next();
};

// Create new job
router.post("/create", verifyToken, validateJob, async (req, res) => {
  try {
    const job = new Job({
      institutionId: req.user.identifier,
      ...req.body,
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error creating job", error });
  }
});

// Get all jobs (with filters)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { targetRole, artForm, specialization, jobType, sortBy } = req.query;
    const userRole = req.user.role;

    let query = {
      lastDate: { $gte: new Date() },
      $or: [{ targetRole: userRole }, { targetRole: "both" }],
    };

    // Add filters if they exist
    if (artForm) query.artForm = artForm;
    if (specialization) query.specialization = specialization;
    if (jobType) query.jobType = jobType;

    // Define sort options
    let sortOption = {};
    switch (sortBy) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "closing-soon":
        sortOption = { lastDate: 1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const jobs = await Job.find(query)
      .populate({
        path: "institutionId",
        select: "userName profilePicture",
        options: { strictPopulate: false },
      })
      .sort(sortOption)
      .lean();

    res.json(jobs);
  } catch (error) {
    console.error("Error in /jobs route:", error);
    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
    });
  }
});

// Apply for a job
router.post(
  "/:jobId/apply",
  verifyToken,
  upload.single("resume"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.jobId);

      // Additional validations
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (new Date(job.lastDate) < new Date()) {
        return res
          .status(400)
          .json({ message: "Job application period has expired" });
      }

      if (job.registrationType === "external") {
        return res
          .status(400)
          .json({ message: "This job uses external application" });
      }

      // Check if user has already applied
      const alreadyApplied = job.applications.some(
        (app) => app.userId.toString() === req.user.identifier
      );
      if (alreadyApplied) {
        return res
          .status(400)
          .json({ message: "You have already applied for this job" });
      }

      // Validate resume file
      if (!req.file && job.registrationType === "internal") {
        return res.status(400).json({ message: "Resume is required" });
      }

      if (req.file && !req.file.mimetype.includes("pdf")) {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      job.applications.push({
        userId: req.user.identifier,
        resume: req.file ? `/resumes/${req.file.filename}` : null,
      });

      await job.save();
      res.json({ message: "Successfully applied for job" });
    } catch (error) {
      res.status(500).json({ message: "Error applying for job", error });
    }
  }
);

// Get institution's jobs with statistics
router.get("/institution", verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({ institutionId: req.user.identifier }).sort({
      createdAt: -1,
    });

    const statistics = jobs
      .filter((job) => job.registrationType !== "external") // Only include non-external jobs
      .map((job) => ({
        jobTitle: job.jobTitle,
        totalApplications: job.applications.length,
        applicationsByStatus: job.applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
        applicationsByDate: job.applications.reduce((acc, app) => {
          const date = app.applicationDate.toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
      }));

    res.json({ jobs, statistics });
  } catch (error) {
    res.status(500).json({ message: "Error fetching institution jobs", error });
  }
});

// Add this route to jobs.js
router.get("/:jobId/applications/download", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate({
      path: "applications.userId",
      select: "userName email",
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is the job creator
    if (job.institutionId.toString() !== req.user.identifier) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Prevent download for external jobs
    if (job.registrationType === "external") {
      return res
        .status(400)
        .json({ message: "Download not available for external jobs" });
    }

    // Create CSV content
    const csvRows = ["Username,Email,Application Date,Resume Link"];
    job.applications.forEach((app) => {
      const resumeLink = app.resume
        ? `${process.env.VITE_BACKEND_URL}${app.resume}`
        : "N/A";

      csvRows.push(
        `${app.userId.userName},${
          app.userId.email
        },${app.applicationDate.toISOString()},${resumeLink}`
      );
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${job.jobTitle}_applications.csv`
    );
    res.send(csvRows.join("\n"));
  } catch (error) {
    res.status(500).json({ message: "Error downloading applications", error });
  }
});

// Delete job
router.delete("/:jobId", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.institutionId.toString() !== req.user.identifier) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this job" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job", error });
  }
});

module.exports = router;
