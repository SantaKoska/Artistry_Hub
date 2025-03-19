const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email, password);
    console.log(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    // Check against environment variables
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { identifier: "admin", role: "admin" },
        process.env.jwt_sckey,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        token: token,
        message: "Admin login successful",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.jwt_sckey);
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized as admin" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Get dashboard statistics
router.get("/stats", verifyAdminToken, async (req, res) => {
  try {
    const User = require("../models/UserModel");
    const Artist = require("../models/ArtistModels");
    const ViewerStudent = require("../models/Viewer-StudentModel");
    const LearningCourse = require("../models/LearningCourseModel");
    const Post = require("../models/PostModels");
    const Institution = require("../models/InstituationModels");
    const ServiceProvider = require("../models/ServiceProviderModels");

    const totalUsers = await User.countDocuments();
    const totalArtists = await Artist.countDocuments();
    const totalStudents = await ViewerStudent.countDocuments();
    const totalCourses = await LearningCourse.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalInstitutions = await Institution.countDocuments();
    const totalServiceProviders = await ServiceProvider.countDocuments();

    // Get recent activity (last 10 users registered)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("userName email role createdAt profilePicture");

    // Get recent posts with complete user information and media fields
    const recentPosts = await Post.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("user", "userName profilePicture email")
      .select("content timestamp likes images mediaUrl mediaType comments");

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalArtists,
        totalStudents,
        totalCourses,
        totalPosts,
        totalInstitutions,
        totalServiceProviders,
      },
      recentActivity: {
        users: recentUsers,
        posts: recentPosts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching admin statistics",
      error: error.message,
    });
  }
});

// Get users with pagination and filtering
router.get("/users", verifyAdminToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;

    const skip = (page - 1) * limit;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const User = require("../models/UserModel");

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password -privateKey -faceData");

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Get user posts - update to include media fields
router.get("/users/:userId/posts", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const Post = require("../models/PostModels");

    const posts = await Post.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profilePicture email")
      .select("content timestamp likes images comments mediaUrl mediaType");

    const total = await Post.countDocuments({ user: userId });

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message,
    });
  }
});

// Get flagged content for moderation - update to include media fields
router.get("/moderation", verifyAdminToken, async (req, res) => {
  try {
    const Post = require("../models/PostModels");

    // Get posts with high moderation scores (potentially inappropriate)
    const flaggedPosts = await Post.find({ moderationScore: { $gt: 0.7 } })
      .sort({ moderationScore: -1 })
      .populate("user", "userName profilePicture email")
      .select(
        "content timestamp likes images comments moderationScore moderationWarnings mediaUrl mediaType"
      )
      .limit(20);

    res.json({
      success: true,
      flaggedContent: flaggedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching moderation data",
      error: error.message,
    });
  }
});

// Update user status (suspend/activate)
router.put("/users/:userId", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;

    if (!["suspend", "activate", "delete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action specified",
      });
    }

    const User = require("../models/UserModel");
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (action === "delete") {
      await User.findByIdAndDelete(userId);
      return res.json({
        success: true,
        message: "User deleted successfully",
      });
    }

    // For future implementation: add suspended field to user model
    // user.suspended = action === 'suspend';
    // await user.save();

    res.json({
      success: true,
      message: `User ${
        action === "suspend" ? "suspended" : "activated"
      } successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message,
    });
  }
});

// Get course management data
router.get("/courses", verifyAdminToken, async (req, res) => {
  try {
    const LearningCourse = require("../models/LearningCourseModel");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await LearningCourse.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "userName")
      .select(
        "courseName level artForm specialization enrolledNumber createdAt"
      );

    const total = await LearningCourse.countDocuments();

    res.json({
      success: true,
      courses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message,
    });
  }
});

// Get user details
router.get("/users/:userId", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require("../models/UserModel");
    const Artist = require("../models/ArtistModels");
    const ViewerStudent = require("../models/Viewer-StudentModel");
    const Institution = require("../models/InstituationModels");
    const ServiceProvider = require("../models/ServiceProviderModels");

    const user = await User.findById(userId).select(
      "-password -privateKey -faceData"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get role-specific details
    let roleDetails = null;
    if (user.role === "Artist") {
      roleDetails = await Artist.findOne({ userId: userId });
    } else if (user.role === "Viewer/Student") {
      roleDetails = await ViewerStudent.findOne({ userId: userId });
    } else if (user.role === "Institution") {
      roleDetails = await Institution.findOne({ userId: userId });
    } else if (user.role === "Service Provider") {
      roleDetails = await ServiceProvider.findOne({ userId: userId });
    }

    // Add role-specific details to the user object
    let userWithDetails = user.toObject();
    if (roleDetails) {
      if (user.role === "Artist") {
        userWithDetails.artistDetails = roleDetails;
      } else if (user.role === "Viewer/Student") {
        userWithDetails.studentDetails = roleDetails;
      } else if (user.role === "Institution") {
        userWithDetails.institutionDetails = roleDetails;
      } else if (user.role === "Service Provider") {
        userWithDetails.serviceProviderDetails = roleDetails;
      }
    }

    res.json({
      success: true,
      user: userWithDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user details",
      error: error.message,
    });
  }
});

// Suspend user
router.post("/users/:userId/suspend", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const User = require("../models/UserModel");
    const mailer = require("../utils/mailer");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    user.suspended = true;
    user.suspensionReason = reason || "Violation of platform guidelines";
    user.suspendedAt = new Date();

    await user.save();

    // Send email notification to user
    const mailOptions = {
      from: process.env.Email_address,
      to: user.email,
      subject: "Your Artistry Hub Account Has Been Suspended",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d32f2f; text-align: center;">Account Suspension Notice</h2>
          <p>Dear ${user.userName},</p>
          <p>We regret to inform you that your Artistry Hub account has been suspended due to the following reason:</p>
          <p style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #d32f2f;"><strong>${user.suspensionReason}</strong></p>
          <p>If you believe this decision was made in error, please contact our support team for assistance.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>The Artistry Hub Team</p>
        </div>
      `,
    };

    await mailer.transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "User suspended successfully and notification email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error suspending user",
      error: error.message,
    });
  }
});

// Verify user
router.post("/users/:userId/verify", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const User = require("../models/UserModel");
    const mailer = require("../utils/mailer");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    user.verified = true;
    user.verifiedAt = new Date();

    // If user was suspended, unsuspend them
    if (user.suspended) {
      user.suspended = false;
      user.suspensionReason = null;
      user.suspendedAt = null;
    }

    await user.save();

    // Send email notification to user
    const mailOptions = {
      from: process.env.Email_address,
      to: user.email,
      subject: "Your Artistry Hub Account Has Been Verified",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4caf50; text-align: center;">Account Verification Notice</h2>
          <p>Dear ${user.userName},</p>
          <p>We are pleased to inform you that your Artistry Hub account has been verified by our admin team.</p>
          <p>This verification confirms that your account meets our platform standards and enhances your credibility within our community.</p>
          <p>Thank you for being a valued member of Artistry Hub!</p>
          <p>Best regards,<br>The Artistry Hub Team</p>
        </div>
      `,
    };

    await mailer.transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "User verified successfully and notification email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying user",
      error: error.message,
    });
  }
});

// Unverify user
router.post("/users/:userId/unverify", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const User = require("../models/UserModel");
    const mailer = require("../utils/mailer");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    user.verified = false;
    user.verifiedAt = null;

    await user.save();

    // Send email notification to user
    const mailOptions = {
      from: process.env.Email_address,
      to: user.email,
      subject: "Your Artistry Hub Account Verification Status",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #f39c12; text-align: center;">Account Verification Update</h2>
          <p>Dear ${user.userName},</p>
          <p>This is to inform you that your Artistry Hub account verification status has been updated.</p>
          <p>Your account is currently not verified. This may affect certain features or privileges on the platform.</p>
          ${reason ? `<p>Reason: ${reason}</p>` : ""}
          <p>If you have any questions, please contact our support team for assistance.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>The Artistry Hub Team</p>
        </div>
      `,
    };

    await mailer.transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "User unverified successfully and notification email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unverifying user",
      error: error.message,
    });
  }
});

// Delete post
router.post("/posts/:postId/delete", verifyAdminToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Deletion reason is required",
      });
    }

    const Post = require("../models/PostModels");
    const User = require("../models/UserModel");
    const mailer = require("../utils/mailer");

    // Find the post with user information
    const post = await Post.findById(postId).populate("user", "email userName");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Store post content for the email
    const postContent = post.content;
    const postDate = post.timestamp;
    const userName = post.user.userName;
    const userEmail = post.user.email;

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Send email notification to user
    const mailOptions = {
      from: process.env.Email_address,
      to: userEmail,
      subject: "Your Post Has Been Removed from Artistry Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #d32f2f; text-align: center;">Post Removal Notice</h2>
          <p>Dear ${userName},</p>
          <p>We're writing to inform you that one of your posts on Artistry Hub has been removed by our admin team.</p>
          <p><strong>Post date:</strong> ${new Date(
            postDate
          ).toLocaleString()}</p>
          <p><strong>Post content:</strong></p>
          <div style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #d32f2f; margin: 10px 0;">
            ${postContent}
          </div>
          <p><strong>Reason for removal:</strong></p>
          <div style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #d32f2f; margin: 10px 0;">
            ${reason}
          </div>
          <p>Please review our community guidelines to ensure your future posts comply with our platform policies.</p>
          <p>If you believe this action was taken in error, you may contact our support team for clarification.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>The Artistry Hub Team</p>
        </div>
      `,
    };

    await mailer.transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Post deleted successfully and notification email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
});

// Add more admin routes as needed

module.exports = router;
