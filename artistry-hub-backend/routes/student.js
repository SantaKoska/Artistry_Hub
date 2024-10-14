const express = require("express");
const router = express.Router();
const User = require("../models/UserModel"); // Updated to use the combined User model
const ViewerStudent = require("../models/Viewer-StudentModel");
const Post = require("../models/PostModels");
const Follower = require("../models/FollowerModels");
const LearningCourse = require("../models/LearningCourseModel");
const ServiceRequest = require("../models/ServiceRequestModels");
const path = require("path");
const Artist = require("../models/ArtistModels");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const multer = require("multer");

//authentication
const { verifyToken } = require("../utils/tokendec");

// Fetch student profile
router.get("/student-profile", verifyToken, async (req, res) => {
  try {
    // console.log(req.user);
    const user = req.user; // extracted from token
    //
    // For debugging purpose
    // console.log("User_id:", user.identifier);
    //
    const profile = await User.findOne({ _id: user.identifier }); // Fetching profile from User model
    const student = await ViewerStudent.findOne({ userId: user.identifier });
    // console.log(student);
    if (!profile || !student) {
      return res
        .status(404)
        .json({ err: "Profile or student information not found" });
    }

    const followerCount = await profile.getNumberOfFollowers(); // Assuming this method exists in the User model

    // For fetching the posts of the user
    const postsinfo = await Post.find({ user: user.identifier }).sort({
      timestamp: -1,
    });

    res.json({
      ...profile.toObject(),
      ...student.toObject(),
      userName: profile.userName, // Fetching username from User model
      followerCount,
      postsinfo,
    });
  } catch (error) {
    console.log("Error fetching profile:", error);
    res.status(500).json({ err: "Server error" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "dp/"); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Append timestamp to file name
  },
});
const upload = multer({ storage });

// Update student profile
router.put(
  "/student-editprofile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      // console.log(req.user);
      const user = req.user; // extracted from token
      const { description, artForm, userName } = req.body;
      // fetch user, profile, and student
      const userRecord = await User.findById(user.identifier);
      const student = await ViewerStudent.findOne({ userId: user.identifier });

      if (!userRecord || !student) {
        return res.status(404).json({ err: "student or user not found" });
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

      // Check if the userName is being updated and if it was updated more than a week ago
      if (userName && userName !== userRecord.userName) {
        const existinguser = await User.findOne({ userName });
        if (existinguser) {
          return res.status(400).json({
            err: "username already exists, please choose a different one",
          });
        }
        if (userRecord.updatedAt < oneWeekAgo) {
          userRecord.userName = userName;
        } else {
          return res.status(403).json({
            err: "you can only update the username once a week",
          });
        }
      }

      // Check if the artForm is being updated and if it was updated more than a week ago
      if (artForm && artForm !== student.artForm) {
        if (student.updatedAt < oneWeekAgo) {
          student.artForm = artForm;
        } else {
          return res.status(403).json({
            err: "you can only update the artForm once a week",
          });
        }
      }

      // Update the description and profile picture without any restrictions
      if (req.file) {
        userRecord.profilePicture = `/dp/${req.file.filename}`; // Store relative path
      }
      if (description) userRecord.description = description;

      // Save all the changes
      await userRecord.save();
      await student.save();

      res.json({ success: "profile updated successfully" });
    } catch (error) {
      console.error("error updating profile:", error);
      res.status(500).json({ err: "server error" });
    }
  }
);

router.get("/homeposts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Get posts by users followed by the logged-in user
    const followedUsers = await Follower.find({ followerId: userId }).select(
      "followingId"
    );
    const followedUserIds = followedUsers.map((f) => f.followingId);

    // Fetch the latest 10 posts from followed users
    const followedPosts = await Post.find({ user: { $in: followedUserIds } })
      .populate("user")
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .limit(10);

    // Fetch the latest 10 posts from users not followed by the logged-in user
    const nonFollowedPosts = await Post.find({
      user: { $nin: followedUserIds.concat([userId]) }, // Posts by others except the user
    })
      .populate("user")
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .limit(10);

    // Combine the two sets of posts
    const posts = [...followedPosts, ...nonFollowedPosts];

    res.json({ posts, userId });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

//
//
//service request `
//
//
//
const ServiceImage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Service/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique name for each file
  },
});

const serviceUpload = multer({ storage: ServiceImage }).array("images", 5);

// Create a service request for students
router.post(
  "/create-service-request",
  verifyToken,
  serviceUpload,
  async (req, res) => {
    try {
      const userId = req.user.identifier;

      // Get the student's art form or any other relevant field
      const student = await ViewerStudent.findOne({ userId });
      if (!student) {
        return res.status(400).json({ msg: "Student not found" });
      }

      const { description } = req.body; // Get description from the body
      const images = req.files.map((file) => `/Service/${file.filename}`); // Get image paths from uploaded files

      const newServiceRequest = new ServiceRequest({
        userId,
        artForm: student.artForm, // Automatically set from the student model (if applicable)
        description,
        images,
      });

      await newServiceRequest.save();
      res.status(201).json(newServiceRequest);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

// Route to retrieve the service requests created by the student
router.get("/my-service-requests", verifyToken, async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({
      userId: req.user.identifier,
    });
    return res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Edit a service request
router.put("/service-requests/:id", serviceUpload, async (req, res) => {
  const { description } = req.body;
  const files = req.files;

  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }

    request.description = description;
    if (files && files.length > 0) {
      request.images = files.map((file) => `/Service/${file.filename}`);
    }
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error updating service request", error });
  }
});

// Delete a service request
router.delete("/service-requests/:id", async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json({ message: "Service request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service request", error });
  }
});

//
//
//Learning section
//
//
//
const findCourseById = async (courseId) => {
  const course = await LearningCourse.findById(courseId);
  if (!course) throw new Error("Course not found");
  return course;
};

// Fetch available courses for student
// Available courses endpoint
router.get("/available-courses", verifyToken, async (req, res) => {
  try {
    // Fetch the student using userId from the token
    const student = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    // Check if the student exists
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch all learning courses that the student is not enrolled in
    const allCourses = await LearningCourse.find({
      _id: { $nin: student.enrolledCourses.map((c) => c.courseId) }, // Filter out already enrolled courses
    });

    // Fetch the artists for the courses
    const courseArtists = await Artist.find({
      userId: { $in: allCourses.map((course) => course.createdBy) }, // Find artists by their userIds
    });

    // Create a map of artist userId to their art form
    const artistArtForms = courseArtists.reduce((acc, artist) => {
      acc[artist.userId] = artist.artForm;
      return acc;
    }, {});

    // Filter courses to include only those created by artists with the same art form as the student
    const availableCourses = allCourses.filter(
      (course) =>
        artistArtForms[course.createdBy.toString()] === student.artForm
    );

    // Return the available courses
    res.status(200).json(availableCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching available courses" });
  }
});

// Search courses by name endpoint
router.get("/search-courses", verifyToken, async (req, res) => {
  const { searchQuery } = req.query;
  try {
    // Fetch the student to check the art form
    const student = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    // Search for courses matching the search query and art form
    const courses = await LearningCourse.find({
      courseName: { $regex: searchQuery, $options: "i" }, // Match course name
      createdBy: { $in: student.artForm }, // Match the artist's art form
    });

    // Return the found courses
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching courses" });
  }
});

// Enroll in a course endpoint
router.post("/enroll/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    // Fetch the student to enroll in the course
    const student = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    // Check if the course exists
    const course = await LearningCourse.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the student is already enrolled in the course
    if (
      student.enrolledCourses.some((c) => c.courseId.toString() === courseId)
    ) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    // Update the student's enrolledCourses
    student.enrolledCourses.push({
      courseId,
      progress: 0, // Initial progress is 0%
      tickedLessons: [], // Initialize tickedLessons as an empty array
      tickedChapters: [], // Initialize tickedChapters as an empty array
      certificateIssued: false,
      certificateName: "",
    });

    // Increment the course's enrolled number and add the student to the enrolledIds
    course.enrolledNumber += 1;
    course.enrolledIds.push(student.userId);

    await student.save();
    await course.save();

    res.status(200).json({ message: "Enrolled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error enrolling in course" });
  }
});

// Unenroll from a course endpoint
router.delete("/unenroll/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    const student = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    // Check if the student is enrolled in the course
    const enrolledCourseIndex = student.enrolledCourses.findIndex(
      (c) => c.courseId.toString() === courseId
    );
    if (enrolledCourseIndex === -1) {
      return res.status(400).json({ message: "Not enrolled in this course" });
    }

    // Remove the course from the student's enrolledCourses
    student.enrolledCourses.splice(enrolledCourseIndex, 1);

    // Update the course's enrolled number and remove the student from enrolledIds
    const course = await LearningCourse.findById(courseId);
    if (course) {
      course.enrolledNumber = Math.max(0, course.enrolledNumber - 1); // Avoid negative values
      course.enrolledIds = course.enrolledIds.filter(
        (id) => id.toString() !== student.userId.toString()
      );
      await course.save();
    }

    await student.save();

    return res
      .status(200)
      .json({ message: "Successfully unenrolled from the course" });
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    return res.status(500).json({ message: "Failed to unenroll from course" });
  }
});

// Fetch enrolled courses endpoint
router.get("/my-courses", verifyToken, async (req, res) => {
  try {
    const student = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    // Check if the student has any enrolled courses
    if (!student || !student.enrolledCourses.length) {
      return res.status(404).json({ message: "No enrolled courses" });
    }

    // Fetch the enrolled course details
    const myCourses = await LearningCourse.find({
      _id: { $in: student.enrolledCourses.map((c) => c.courseId) },
    });

    res.status(200).json(myCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching enrolled courses" });
  }
});

// Fetch course progress endpoint
router.get("/course-progress/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    // Find the viewer student by their userId
    const viewerStudent = await ViewerStudent.findOne({
      userId: req.user.identifier,
    }).populate({
      path: "enrolledCourses.courseId", // Populate course information
      select: "courseName level chapters", // Choose what to populate
    });

    if (!viewerStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the enrolled course
    const enrolledCourse = viewerStudent.enrolledCourses.find(
      (course) => course.courseId._id.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(404).json({ message: "Enrolled course not found" });
    }

    // Get progress details including ticked lessons and ticked chapters
    const courseProgress = {
      courseId: enrolledCourse.courseId._id,
      courseName: enrolledCourse.courseId.courseName,
      level: enrolledCourse.courseId.level,
      progress: enrolledCourse.progress, // Progress in percentage
      tickedLessons: enrolledCourse.tickedLessons, // Completed lesson IDs
      tickedChapters: enrolledCourse.tickedChapters, // Completed chapter IDs
      certificateIssued: enrolledCourse.certificateIssued,
    };

    res.status(200).json(courseProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching course progress" });
  }
});

// Mark lesson as complete
router.post(
  "/complete-lesson/:courseId/:chapterId/:lessonId",
  verifyToken,
  async (req, res) => {
    const { courseId, chapterId, lessonId } = req.params;
    try {
      const viewerStudent = await ViewerStudent.findOne({
        userId: req.user.identifier,
      });

      const enrolledCourse = viewerStudent.enrolledCourses.find(
        (course) => course.courseId.toString() === courseId
      );

      if (!enrolledCourse) {
        return res.status(404).json({ message: "Enrolled course not found" });
      }

      const course = await LearningCourse.findById(courseId);
      const chapter = course.chapters.find(
        (ch) => ch._id.toString() === chapterId
      );

      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      const lesson = chapter.lessons.find(
        (ls) => ls._id.toString() === lessonId
      );

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (enrolledCourse.tickedLessons.includes(lesson._id)) {
        return res.status(400).json({ message: "Lesson already completed" });
      }

      enrolledCourse.tickedLessons.push(lesson._id);

      const allLessonsCompleted = chapter.lessons.every((ls) =>
        enrolledCourse.tickedLessons.includes(ls._id)
      );

      if (
        allLessonsCompleted &&
        !enrolledCourse.tickedChapters.includes(chapter._id)
      ) {
        enrolledCourse.tickedChapters.push(chapter._id);
      }

      const allChaptersCompleted = course.chapters.every((ch) =>
        enrolledCourse.tickedChapters.includes(ch._id)
      );

      if (allChaptersCompleted) {
        enrolledCourse.certificateIssued = true;
      }

      const totalLessons = course.chapters.reduce(
        (sum, ch) => sum + ch.lessons.length,
        0
      );
      enrolledCourse.progress = Math.round(
        (enrolledCourse.tickedLessons.length / totalLessons) * 100
      );

      await viewerStudent.save();

      res.status(200).json({
        message: "Lesson marked as complete",
        certificateReady: allChaptersCompleted,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error marking lesson complete" });
    }
  }
);

// In your routes file
router.get("/check-completion/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;

  try {
    // Fetch the student and their enrolled course details
    const viewerStudent = await ViewerStudent.findOne({
      userId: req.user.identifier,
    });

    const enrolledCourse = viewerStudent.enrolledCourses.find(
      (course) => course.courseId.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Fetch course details
    const course = await LearningCourse.findById(courseId).populate(
      "chapters.lessons"
    ); // Populate lessons

    // Check if all chapters are ticked
    const allChaptersCompleted =
      enrolledCourse.tickedChapters.length === course.chapters.length;

    // Check if all lessons within each chapter are ticked
    const allLessonsCompleted = course.chapters.every(
      (chapter) =>
        enrolledCourse.tickedLessons.filter((lesson) =>
          chapter.lessons.some(
            (courseLesson) => courseLesson._id.toString() === lesson.toString()
          )
        ).length === chapter.lessons.length
    );

    const isCompleted = allChaptersCompleted && allLessonsCompleted;

    // Send the completion status and enrolled course details in the response
    res.status(200).json({
      isCompleted,
      enrolledCourse, // Send enrolledCourse details as well
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking completion status." });
  }
});

router.post(
  "/generate-certificate/:courseId",
  verifyToken,
  async (req, res) => {
    const { courseId } = req.params;
    const { certificateName } = req.body; // Extracting certificateName from the request body

    try {
      // Fetch the student and their enrolled course details
      const viewerStudent = await ViewerStudent.findOne({
        userId: req.user.identifier,
      });

      const enrolledCourse = viewerStudent.enrolledCourses.find(
        (course) => course.courseId.toString() === courseId
      );

      // Check if the course is completed
      if (!enrolledCourse || !enrolledCourse.certificateIssued) {
        return res
          .status(400)
          .json({ message: "Certificate cannot be generated." });
      }

      // Fetch course details
      const course = await LearningCourse.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }

      // Create a PDF document
      const doc = new PDFDocument({ size: "A4", layout: "landscape" });

      // Set headers to make the document downloadable
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${certificateName || "Certificate"}.pdf"`
      );

      // Define colors, margins, and fonts
      const primaryColor = "#333";
      const secondaryColor = "#666";
      const accentColor = "#2980b9"; // A blue accent color for highlights
      const margin = 50;

      // Insert logo at the top center
      const logoPath = path.join(__dirname, "../../storage/LOGO.png");
      doc.image(logoPath, (doc.page.width - 80) / 2, margin, { width: 80 });

      doc.moveDown(10);

      // Title "Certificate of Completion" with an accent color
      doc
        .fillColor(accentColor)
        .fontSize(35)
        .font("Helvetica-Bold")
        .text("Certificate of Completion", { align: "center" });

      // Create space below the title
      doc.moveDown(0.5);

      // Subtitle "This certifies that"
      doc
        .fillColor(primaryColor)
        .fontSize(20)
        .font("Helvetica")
        .text("This certifies that", { align: "center" });

      // Student's Name with larger font size
      doc
        .moveDown(0.5)
        .fontSize(30)
        .font("Helvetica-Bold")
        .text(certificateName || "Student", {
          align: "center",
          fillColor: primaryColor,
        });

      // Text "has successfully completed the course"
      doc
        .moveDown(0.5)
        .fontSize(20)
        .text("has successfully completed the course:", { align: "center" });

      // Course Name
      doc
        .moveDown(0.5)
        .fontSize(28)
        .font("Helvetica-Bold")
        .fillColor(accentColor)
        .text(course.courseName, { align: "center" });

      // Optional decorative line
      doc
        .moveDown(0.5)
        .moveTo(margin, doc.y)
        .lineTo(doc.page.width - margin, doc.y)
        .strokeColor(accentColor)
        .stroke();

      // Issue Date
      doc
        .moveDown(1)
        .fontSize(18)
        .fillColor(secondaryColor)
        .text("Issued on: " + new Date().toLocaleDateString(), {
          align: "center",
        });

      // Signature (optional) - you can uncomment if needed
      // doc
      //     .moveDown(2)
      //     .fontSize(16)
      //     .fillColor(primaryColor)
      //     .text("Signature", margin, doc.page.height - margin - 40, { align: "left" })
      //     .moveTo(margin, doc.page.height - margin - 30)
      //     .lineTo(margin + 150, doc.page.height - margin - 30)
      //     .stroke();

      // Organization/Institute Name (aligned right)

      // End the document
      doc.end();

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Update the enrolled course status
      enrolledCourse.certificateIssued = true;
      enrolledCourse.certificateName = certificateName; // Store the name in the enrolled course
      await viewerStudent.save();
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Error generating certificate." });
    }
  }
);

module.exports = router;
