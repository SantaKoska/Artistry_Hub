const express = require("express");
const router = express.Router();
const User = require("../models/UserModel"); // Updated to use the combined User model
const Artist = require("../models/ArtistModels");
const Post = require("../models/PostModels");
const Follower = require("../models/FollowerModels");
const LearningCourse = require("../models/LearningCourseModel");
const ServiceRequest = require("../models/ServiceRequestModels");
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

    // Get user's artForm (if needed)
    const artist = await Artist.findOne({ userId });

    // Get posts by users followed by the logged-in user
    const followedUsers = await Follower.find({ followerId: userId }).select(
      "followingId"
    );
    const followedUserIds = followedUsers.map((f) => f.followingId);

    // Fetch followed posts and sort by createdAt
    const followedPosts = await Post.find({ user: { $in: followedUserIds } })
      .populate("user")
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(10);

    // Fetch posts by all other users and sort by createdAt
    const otherPosts = await Post.find({
      user: { $nin: followedUserIds.concat([userId]) },
    })
      .populate("user")
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(10);

    // Combine both followed and other posts
    const posts = [...followedPosts, ...otherPosts];

    // Sort the combined posts by createdAt to get the most recent posts first
    const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);

    res.json({ posts: sortedPosts, userId });
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
    cb(null, "learning/videos/"); // Path to save videos
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique name for each file
  },
});

const videoUpload = multer({ storage: videoStorage });

// Create a new course
router.post("/create-course", verifyToken, async (req, res) => {
  const { courseName, level } = req.body;

  try {
    // Check if a course with the same name already exists
    const existingCourse = await LearningCourse.findOne({ courseName });

    if (existingCourse) {
      return res.status(400).json({
        message: "Course name already exists. Please choose a different name.",
      });
    }

    // Create the new course if the name is unique
    const newCourse = new LearningCourse({
      courseName,
      level,
      videos: [],
      createdBy: req.user.identifier,
    });

    await newCourse.save();

    // Add course reference to the artist's teaching courses
    await Artist.findOneAndUpdate(
      { userId: req.user.identifier },
      { $push: { teachingCourse: newCourse._id } }
    );

    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Add video with optional note to course
router.post(
  "/add-video/:courseId",
  verifyToken,
  videoUpload.single("video"),
  async (req, res) => {
    const { courseId } = req.params;
    const { title, description, note } = req.body;

    try {
      const course = await LearningCourse.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // Limit videos to a maximum of 10
      if (course.videos.length >= 10) {
        return res
          .status(400)
          .json({ error: "Cannot add more than 10 videos" });
      }

      const videoObj = {
        title,
        description,
        mediaUrl: `/learning/videos/${req.file.filename}`, // Store video path
        note, // Directly associate the note with the video
      };

      course.videos.push(videoObj);
      await course.save();
      res.status(200).json(course);
    } catch (error) {
      console.error("Error adding video:", error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
);

// Edit a course
router.put("/edit-course/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  const { courseName, level } = req.body;

  try {
    const course = await LearningCourse.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.courseName = courseName || course.courseName;
    course.level = level || course.level;

    await course.save();
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Delete a course
router.delete("/delete-course/:courseId", verifyToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    await LearningCourse.findByIdAndDelete(courseId);

    // Also remove the course reference from artist's teaching courses
    await Artist.findOneAndUpdate(
      { userId: req.user.identifier },
      { $pull: { teachingCourse: courseId } }
    );

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Edit a video within a course
router.put(
  "/edit-video/:courseId/:videoId",
  verifyToken,
  videoUpload.single("video"), // Include file upload handler
  async (req, res) => {
    const { courseId, videoId } = req.params;
    const { title, description, note } = req.body;
    console.log(req.body);

    try {
      const course = await LearningCourse.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      const video = course.videos.id(videoId);
      if (!video) return res.status(404).json({ error: "Video not found" });

      video.title = title || video.title;
      video.description = description || video.description;
      video.note = note || video.note; // Update the note if provided

      // Handle video file replacement
      if (req.file) {
        video.mediaUrl = `/learning/videos/${req.file.filename}`; // Update the video URL with new file path
      }

      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update video" });
    }
  }
);

// Delete a video from a course
router.delete(
  "/delete-video/:courseId/:videoId",
  verifyToken,
  async (req, res) => {
    const { courseId, videoId } = req.params;

    try {
      const course = await LearningCourse.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      course.videos = course.videos.filter(
        (video) => video._id.toString() !== videoId
      );
      await course.save();
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  }
);

// Get courses created by the artist
router.get("/my-courses", verifyToken, async (req, res) => {
  try {
    const courses = await LearningCourse.find({
      createdBy: req.user.identifier,
    });

    if (courses.length === 0) {
      return res.status(200).json({ message: "No courses found" });
    }
    res.status(200).json(courses);
    // console.log(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get videos in a specific course
router.get("/get-videos/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await LearningCourse.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.status(200).json({ videos: course.videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({ message: "Server error" });
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
