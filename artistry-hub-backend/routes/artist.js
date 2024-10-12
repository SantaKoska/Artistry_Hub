const express = require("express");
const router = express.Router();
const User = require("../models/UserModel"); // Updated to use the combined User model
const Artist = require("../models/ArtistModels");
const Post = require("../models/PostModels");
const Follower = require("../models/FollowerModels");
const LearningCourse = require("../models/LearningCourseModel");
const ServiceRequest = require("../models/ServiceRequestModels");
const path = require("path");
const multer = require("multer");

//authentication
const { verifyToken } = require("../utils/tokendec");

// get profile of the user with the help of the user id we got from verification and place it in the req
router.get("/artist-profile", verifyToken, async (req, res) => {
  try {
    const user = req.user; // extracted from token
    //
    //
    //
    //for debugging purpose
    // console.log("User_id:", user.identifier);
    //
    //
    const profile = await User.findOne({ _id: user.identifier }); // Fetching profile from User model
    const artist = await Artist.findOne({ userId: user.identifier });
    // console.log(artist);
    if (!profile || !artist) {
      return res
        .status(404)
        .json({ err: "Profile or artist information not found" });
    }

    const followerCount = await profile.getNumberOfFollowers(); // Assuming this method exists in the User model

    //for fetching the post of the user
    const postsinfo = await Post.find({ user: user.identifier }).sort({
      timestamp: -1,
    });

    res.json({
      ...profile.toObject(),
      ...artist.toObject(),
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

// update profile
router.put(
  "/artist-editprofile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const user = req.user; // extracted from token
      const { description, artForm, specialisation, userName } = req.body;

      // fetch user, profile, and artist
      const userRecord = await User.findById(user.identifier);
      const artist = await Artist.findOne({ userId: user.identifier });

      if (!userRecord || !artist) {
        return res.status(404).json({ err: "artist or user not found" });
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

      // check if the userName is being updated and if it was updated more than a week ago
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

      // check if the artForm is being updated and if it was updated more than a week ago
      if (artForm && artForm !== artist.artForm) {
        if (artist.updatedAt < oneWeekAgo) {
          artist.artForm = artForm;
        } else {
          return res.status(403).json({
            err: "you can only update the artForm once a week",
          });
        }
      }

      // check if the specialisation is being updated and if it was updated more than a week ago
      if (specialisation && specialisation !== artist.specialisation) {
        if (artist.updatedAt < oneWeekAgo) {
          artist.specialisation = specialisation;
        } else {
          return res.status(403).json({
            err: "you can only update the specialisation once a week",
          });
        }
      }

      // update the description and profile picture without any restrictions
      if (req.file) {
        userRecord.profilePicture = `/dp/${req.file.filename}`; // Store relative path
      }
      if (description) userRecord.description = description;

      // save all the changes
      await userRecord.save();
      await artist.save();

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
//for learning section
//
//

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videosPath = path.join(__dirname, "../learning/videos/");
    const notesPath = path.join(__dirname, "../learning/notes/");
    // Check the file type and save to the appropriate folder
    if (file.mimetype.startsWith("video")) {
      cb(null, videosPath);
    } else {
      cb(null, notesPath);
    }
  },
  filename: (req, file, cb) => {
    // Save the file with a unique name (timestamp)
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const videoornoteUpload = multer({ storage: videoStorage });

// Helper function for checking course existence
const findCourseById = async (courseId) => {
  const course = await LearningCourse.findById(courseId);
  if (!course) throw new Error("Course not found");
  return course;
};

// Helper function for checking chapter existence
const findChapterInCourse = (course, chapterId) => {
  const chapter = course.chapters.id(chapterId);
  if (!chapter) throw new Error("Chapter not found");
  return chapter;
};

// Create a new course
router.post("/create-course", verifyToken, async (req, res) => {
  const { courseName, level } = req.body;
  // console.log("req body", req.body);
  try {
    const existingCourse = await LearningCourse.findOne({ courseName });
    if (existingCourse) {
      return res.status(400).json({ message: "Course name already exists." });
    }

    const newCourse = new LearningCourse({
      courseName,
      level,
      chapters: [],
      createdBy: req.user.identifier,
    });

    console.log("find the new course information", req.user.identifier);
    await newCourse.save();
    await Artist.findOneAndUpdate(
      { userId: req.user.identifier },
      { $push: { teachingCourse: newCourse._id } }
    );
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course", error });
  }
});

// Delete course by ID
router.delete("/delete-course/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const course = await LearningCourse.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if the user is authorized to delete the course
    if (course.createdBy.toString() !== req.user.identifier) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this course." });
    }

    // Remove course from the artist's teachingCourse array
    await Artist.findOneAndUpdate(
      { userId: req.user.identifier },
      { $pull: { teachingCourse: course._id } }
    );

    // Delete the course
    await LearningCourse.deleteOne({ _id: id });
    res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error });
  }
});

router.get("/my-courses", verifyToken, async (req, res) => {
  try {
    // Fetch courses created by the authenticated user
    const courses = await LearningCourse.find({
      createdBy: req.user.identifier,
    }).populate("chapters");

    if (!courses.length) {
      return res
        .status(200)
        .json({ message: "No courses found for this user." });
    }

    res.status(200).json(courses);
  } catch (error) {
    console.log("Error fetching courses:", error);
    res.status(500).json({ message: "Error fetching courses", error });
  }
});

// Add Chapter to a Course
router.post("/add-chapter/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  try {
    const course = await findCourseById(courseId);
    course.chapters.push({ title, description, lessons: [] });
    await course.save();
    res.status(200).json(course);
    console.log(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding chapter", error });
  }
});

// Add Lesson (video, note) to Chapter
router.post(
  "/add-lesson/:courseId/:chapterId",
  verifyToken,
  videoornoteUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "note", maxCount: 1 },
  ]),
  async (req, res) => {
    const { courseId, chapterId } = req.params;
    const { title, description } = req.body;
    console.log(req.params);

    try {
      const course = await findCourseById(courseId);
      const chapter = findChapterInCourse(course, chapterId);

      if (chapter.lessons.length >= 10) {
        return res.status(400).json({
          message: "Cannot add more than 10 lessons to this chapter.",
        });
      }

      // Fetch video and note file paths
      const videoFile =
        req.files && req.files.video ? req.files.video[0].filename : null;
      const noteFile =
        req.files && req.files.note ? req.files.note[0].filename : null;

      chapter.lessons.push({
        title,
        description,
        mediaUrl: videoFile ? `/learning/videos/${videoFile}` : null,
        noteUrl: noteFile ? `/learning/notes/${noteFile}` : "",
      });

      await course.save();
      res.status(200).json(course);
    } catch (error) {
      console.error("Error adding lesson:", error);
      res.status(500).json({ message: "Error adding lesson", error });
    }
  }
);

// Edit Chapter
router.put(
  "/edit-chapter/:courseId/:chapterId",
  verifyToken,
  async (req, res) => {
    const { courseId, chapterId } = req.params;
    const { title, description } = req.body;

    try {
      const course = await findCourseById(courseId);
      const chapter = findChapterInCourse(course, chapterId);

      chapter.title = title || chapter.title;
      chapter.description = description || chapter.description;

      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ message: "Error editing chapter", error });
    }
  }
);

// Delete Chapter
router.delete(
  "/delete-chapter/:courseId/:chapterId",
  verifyToken,
  async (req, res) => {
    const { courseId, chapterId } = req.params;

    try {
      const course = await findCourseById(courseId);
      course.chapters = course.chapters.filter(
        (ch) => ch._id.toString() !== chapterId
      );
      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ message: "Error deleting chapter", error });
    }
  }
);

// Edit Lesson
router.put(
  "/edit-lesson/:courseId/:chapterId/:lessonId",
  verifyToken,
  videoornoteUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "note", maxCount: 1 },
  ]),
  async (req, res) => {
    const { courseId, chapterId, lessonId } = req.params;
    const { title, description } = req.body;

    try {
      const course = await findCourseById(courseId);
      const chapter = findChapterInCourse(course, chapterId);
      const lesson = chapter.lessons.id(lessonId);

      lesson.title = title || lesson.title;
      lesson.description = description || lesson.description;
      lesson.mediaUrl = req.file
        ? `/learning/videos/${req.file.filename}`
        : lesson.mediaUrl;
      lesson.noteUrl = req.file
        ? `/learning/notes/${req.file.filename}`
        : lesson.noteUrl;

      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ message: "Error editing lesson", error });
    }
  }
);

// Delete Lesson
router.delete(
  "/delete-lesson/:courseId/:chapterId/:lessonId",
  verifyToken,
  async (req, res) => {
    console.log(req.params);
    const { courseId, chapterId, lessonId } = req.params;

    try {
      const course = await findCourseById(courseId);
      const chapter = findChapterInCourse(course, chapterId);

      chapter.lessons = chapter.lessons.filter(
        (lesson) => lesson._id.toString() !== lessonId
      );
      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ message: "Error deleting lesson", error });
    }
  }
);

// Edit Course Details (Course Name, Level, etc.)
router.put("/edit-course/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  const { courseName, level, chapters } = req.body; // Assuming you're sending the courseName, level, and chapters

  try {
    const course = await LearningCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if the courseName is unique (excluding current course)
    if (courseName && courseName !== course.courseName) {
      const existingCourse = await LearningCourse.findOne({ courseName });
      if (existingCourse) {
        return res.status(400).json({ message: "Course name already exists." });
      }
    }

    // Update course details
    course.courseName = courseName || course.courseName;
    course.level = level || course.level;

    // If chapters are provided in the request body, update the chapters
    if (chapters && Array.isArray(chapters)) {
      course.chapters = chapters.map((chapter) => {
        return {
          _id: chapter._id, // Keep the original chapter ID
          title: chapter.title || "",
          description: chapter.description || "",
          lessons: chapter.lessons
            ? chapter.lessons.map((lesson) => ({
                _id: lesson._id, // Keep the original lesson ID
                title: lesson.title || "",
                description: lesson.description || "",
                mediaUrl: lesson.mediaUrl || "",
                noteUrl: lesson.noteUrl || "",
              }))
            : [], // Map lessons or leave as an empty array
        };
      });
    }

    await course.save(); // Save updated course
    res.status(200).json(course);
  } catch (error) {
    console.error;
    res.status(500).json({ message: "Error updating course", error });
  }
});

//
//
//
//Service Request route
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

const serviceupload = multer({ storage: ServiceImage }).array("images", 5);

router.post(
  "/create-service-request",
  verifyToken,
  serviceupload,
  async (req, res) => {
    try {
      const userId = req.user.identifier;

      // Get the artist's art form
      const artist = await Artist.findOne({ userId });
      if (!artist) {
        return res.status(400).json({ msg: "Artist not found" });
      }

      const { description } = req.body; // Get description from the body
      const images = req.files.map((file) => `/Service/${file.filename}`); // Get image paths from uploaded files

      const newServiceRequest = new ServiceRequest({
        userId,
        artForm: artist.artForm, // Automatically set from the artist model
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

// Route to retrieve the service requests created by the user (using your existing code)
router.get("/my-service-requests", verifyToken, async (req, res) => {
  try {
    const serviceRequests = await ServiceRequest.find({
      userId: req.user.identifier,
    });
    // console.log(serviceRequests);
    return res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Edit a service request (same as before)
router.put("/service-requests/:id", serviceupload, async (req, res) => {
  const { description } = req.body;
  const files = req.files;

  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Service request not found" });

    request.description = description;
    if (files.length > 0) {
      request.images = files.map((file) => `/Service/${file.filename}`);
    }
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error updating service request", error });
  }
});

// Delete a service request (same as before)
router.delete("/service-requests/:id", async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Service request not found" });
    res.json({ message: "Service request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service request", error });
  }
});

module.exports = router;
