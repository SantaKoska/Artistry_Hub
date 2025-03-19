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
const ArtFormSpecialization = require("../models/ArtFormSpecializationModels"); // Import the model

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
      numberOfPosts: postsinfo.length,
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
    const { mediaType, sortBy } = req.query; // Add query parameters

    // Get posts by users followed by the logged-in user
    const followedUsers = await Follower.find({ followerId: userId }).select(
      "followingId"
    );
    const followedUserIds = followedUsers.map((f) => f.followingId);

    // Build the query based on filters
    let query = {
      user: { $in: followedUserIds },
    };

    // Add mediaType filter if specified
    if (mediaType && mediaType !== "all") {
      query.mediaType = mediaType;
    }

    // Create the base query
    let followedPostsQuery = Post.find(query).populate("user");

    // Apply sorting
    switch (sortBy) {
      case "trending":
        followedPostsQuery = followedPostsQuery.sort({
          likes: -1,
          timestamp: -1,
        });
        break;
      case "oldest":
        followedPostsQuery = followedPostsQuery.sort({ timestamp: 1 });
        break;
      case "newest":
      default:
        followedPostsQuery = followedPostsQuery.sort({ timestamp: -1 });
        break;
    }

    const followedPosts = await followedPostsQuery.limit(10);

    // Similar query for non-followed posts
    let nonFollowedQuery = {
      user: { $nin: followedUserIds.concat([userId]) },
    };

    if (mediaType && mediaType !== "all") {
      nonFollowedQuery.mediaType = mediaType;
    }

    let nonFollowedPostsQuery = Post.find(nonFollowedQuery).populate("user");

    // Apply the same sorting
    switch (sortBy) {
      case "trending":
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({
          likes: -1,
          timestamp: -1,
        });
        break;
      case "oldest":
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({ timestamp: 1 });
        break;
      case "newest":
      default:
        nonFollowedPostsQuery = nonFollowedPostsQuery.sort({ timestamp: -1 });
        break;
    }

    const nonFollowedPosts = await nonFollowedPostsQuery.limit(100);

    // Combine the posts
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
  const { courseName, level, artForm, specialization } = req.body;
  try {
    const existingCourse = await LearningCourse.findOne({ courseName });
    if (existingCourse) {
      return res.status(400).json({ message: "Course name already exists." });
    }

    const newCourse = new LearningCourse({
      courseName,
      level,
      artForm,
      specialization,
      chapters: [],
      createdBy: req.user.identifier,
      certificateSerials: [], // This will now be an empty array without any null values
      enrolledNumber: 0,
      enrolledIds: [],
    });

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
    // console.log(courses);
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
    // console.log(course);
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
    // console.log(req.params);

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
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const chapter = findChapterInCourse(course, chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      const lesson = chapter.lessons.id(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Update title and description if provided
      lesson.title = title || lesson.title;
      lesson.description = description || lesson.description;

      // Update media URLs only if new files are uploaded
      if (req.files && req.files.video && req.files.video[0]) {
        lesson.mediaUrl = `/learning/videos/${req.files.video[0].filename}`;
      }

      if (req.files && req.files.note && req.files.note[0]) {
        lesson.noteUrl = `/learning/notes/${req.files.note[0].filename}`;
      }

      // Save the updated course
      await course.save();
      res.status(200).json(course);
    } catch (error) {
      console.error("Error editing lesson", error);
      res.status(500).json({ message: "Error editing lesson", error });
    }
  }
);

// Delete Lesson
router.delete(
  "/delete-lesson/:courseId/:chapterId/:lessonId",
  verifyToken,
  async (req, res) => {
    // console.log(req.params);
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

// Create a service request
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

      const { description, specialization } = req.body; // Get description and specialization from the body
      const images = req.files.map((file) => `/Service/${file.filename}`); // Get image paths from uploaded files

      const newServiceRequest = new ServiceRequest({
        userId,
        artForm: artist.artForm,
        specialization,
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

// Retrieve the service requests created by the user
router.get("/my-service-requests", verifyToken, async (req, res) => {
  try {
    // First, find the artist using the user's identifier
    const artist = await Artist.findOne({ userId: req.user.identifier }).select(
      "artForm"
    );

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Then, find the service requests by the user
    const serviceRequests = await ServiceRequest.find({
      userId: req.user.identifier,
    }).populate("serviceProviderId"); // Populate service provider details

    // Prepare the response
    const serviceRequestsWithArtForm = serviceRequests.map((request) => ({
      ...request.toObject(), // Attach the service request details
      artForm: artist.artForm, // Attach the artist's art form
    }));

    // Return the response with the art form and service requests
    return res.status(200).json({
      artForm: artist.artForm, // Always include the art form
      serviceRequests: serviceRequestsWithArtForm, // Include service requests (empty if none)
    });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Fetch accepted service providers for a specific service request
router.get(
  "/service-requests/:id/service-providers",
  verifyToken,
  async (req, res) => {
    try {
      const request = await ServiceRequest.findById(req.params.id).populate(
        "serviceProviderId"
      );
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }

      // Assuming serviceProviderId contains the IDs of accepted service providers
      const acceptedProviders = await User.find({
        _id: { $in: request.serviceProviderId },
      });

      res.status(200).json(acceptedProviders);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Select a service provider for a service request
router.put(
  "/service-requests/:id/select-provider",
  verifyToken,
  async (req, res) => {
    const { serviceProviderId } = req.body;
    const currentUser = req.user; // Assuming req.user contains the authenticated user

    try {
      // Find the service request
      const request = await ServiceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }

      // Update the service provider and status
      request.status = "Accepted"; // Change status to Accepted

      await request.save();

      // Automatically follow the service provider
      const serviceProvider = await User.findById(serviceProviderId); // Assuming serviceProviderId is the _id of the User
      if (!serviceProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }

      // Check if the current user is already following the service provider
      const followRecord = await Follower.findOne({
        followerId: currentUser.identifier,
        followingId: serviceProvider._id,
      });

      if (!followRecord) {
        // If not following, create a new follower document
        const newFollow = new Follower({
          followerId: currentUser.identifier,
          followingId: serviceProvider._id,
        });
        await newFollow.save();

        // Update the current user's following list
        await User.findByIdAndUpdate(currentUser.identifier, {
          $addToSet: { following: serviceProvider._id },
        });
      }

      res.json({
        message: "Service provider selected and followed successfully",
        request,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error selecting service provider", error });
    }
  }
);

// Edit a service request
router.put("/service-requests/:id", serviceupload, async (req, res) => {
  const { description } = req.body;
  const files = req.files;

  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Service request not found" });

    // Prevent editing if the request is accepted
    if (request.status === "Accepted") {
      return res.status(403).json({ message: "Cannot edit accepted requests" });
    }

    request.description = description;

    // Allow new images to be added without removing existing ones
    if (files.length > 0) {
      if (request.images.length + files.length > 5) {
        // Assuming the limit is 5
        return res
          .status(400)
          .json({ message: "Image limit reached. Please remove some images." });
      }
      request.images.push(...files.map((file) => `/Service/${file.filename}`));
    }

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error updating service request", error });
  }
});

// Remove a specific image from the service request
router.delete("/service-requests/:id/images", async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body;
  try {
    const request = await ServiceRequest.findById(id);
    if (!request)
      return res.status(407).json({ message: "Service request not found" });

    // Prevent editing if the request is accepted
    if (request.status === "Accepted") {
      return res
        .status(403)
        .json({ message: "Cannot remove images from accepted requests" });
    }

    // Filter out the image to be removed
    request.images = request.images.filter((img) => img !== imagePath);

    await request.save();
    res.json({ message: "Image removed", images: request.images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing image", error });
  }
});

// Delete a service request
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

// Get analytics data for courses
router.get("/course-analytics", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Fetch courses created by the user
    const courses = await LearningCourse.find({ createdBy: userId }).populate(
      "enrolledIds"
    );

    const analytics = courses.map((course) => ({
      courseName: course.courseName,
      enrolledCount: course.enrolledIds.length,
      // Add more metrics as needed
    }));

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    res.status(500).json({ message: "Error fetching analytics", error });
  }
});

// Get course details by ID
router.get("/course/:id", verifyToken, async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id).populate(
      "chapters.lessons"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ message: "Error fetching course details", error });
  }
});

// Endpoint to get art forms
router.get("/art-forms", async (req, res) => {
  try {
    const artForms = await ArtFormSpecialization.find({});
    res.json(artForms.map((form) => form.artForm));
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
    res.json(artForm);
  } catch (error) {
    res.status(500).json({ message: "Error fetching specializations", error });
  }
});

// Add this new route to handle post analytics
router.get("/post-analytics", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Get all posts by the user with populated comments
    const userPosts = await Post.find({ user: userId })
      .populate("comments.user")
      .populate("likedBy")
      .sort({ timestamp: -1 });

    // Get user data with followers count
    const userData = await User.findById(userId);
    const followersCount = await userData.getNumberOfFollowers();

    // Calculate total engagement metrics
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = userPosts.reduce(
      (sum, post) => sum + post.comments.length,
      0
    );

    // Find most engaged post (combining likes and comments)
    const mostEngagedPost = userPosts.reduce(
      (prev, current) => {
        const prevEngagement = prev.likes + prev.comments.length;
        const currentEngagement = current.likes + current.comments.length;
        return prevEngagement > currentEngagement ? prev : current;
      },
      { likes: 0, comments: [] }
    );

    // Calculate recent engagement (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = userPosts.filter(
      (post) => post.timestamp >= sevenDaysAgo
    );
    const olderPosts = userPosts.filter(
      (post) => post.timestamp < sevenDaysAgo
    );

    // Calculate engagement rates
    const recentEngagementRate =
      recentPosts.length > 0
        ? (recentPosts.reduce((sum, post) => {
            const postEngagement = post.likes + post.comments.length;
            return sum + postEngagement;
          }, 0) /
            recentPosts.length /
            followersCount) *
          100
        : 0;

    const olderEngagementRate =
      olderPosts.length > 0
        ? (olderPosts.reduce((sum, post) => {
            const postEngagement = post.likes + post.comments.length;
            return sum + postEngagement;
          }, 0) /
            olderPosts.length /
            followersCount) *
          100
        : 0;

    // Calculate unique engagers (people who either liked or commented)
    const uniqueEngagers = new Set();
    userPosts.forEach((post) => {
      post.likedBy.forEach((user) => uniqueEngagers.add(user._id.toString()));
      post.comments.forEach((comment) =>
        uniqueEngagers.add(comment.user._id.toString())
      );
    });

    const interactionTrend =
      recentEngagementRate > olderEngagementRate
        ? "up"
        : recentEngagementRate < olderEngagementRate
        ? "down"
        : "stable";

    res.json({
      totalPosts: userPosts.length,
      totalLikes,
      totalComments,
      uniqueEngagers: uniqueEngagers.size,
      mostEngagedPost:
        mostEngagedPost.likes > 0
          ? {
              content: mostEngagedPost.content,
              likes: mostEngagedPost.likes,
              comments: mostEngagedPost.comments.length,
              totalEngagement:
                mostEngagedPost.likes + mostEngagedPost.comments.length,
              mediaUrl: mostEngagedPost.mediaUrl,
              mediaType: mostEngagedPost.mediaType,
            }
          : null,
      recentEngagement: Math.round(recentEngagementRate * 100) / 100,
      interactionTrend,
      engagementMetrics: {
        averageLikesPerPost: totalLikes / userPosts.length || 0,
        averageCommentsPerPost: totalComments / userPosts.length || 0,
        followerEngagementRate:
          (uniqueEngagers.size / followersCount) * 100 || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching post analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

module.exports = router;
