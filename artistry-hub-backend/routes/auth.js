const express = require("express");
const User = require("../models/UserModel");
const Artist = require("../models/ArtistModels");
const ServiceProvider = require("../models/ServiceProviderModels");
const Institutions = require("../models/InstituationModels");
const ViewerStudent = require("../models/Viewer-StudentModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { getToken } = require("../utils/helper");
const OTPModel = require("../models/OTPModels");
const { generateOTP, transporter } = require("../utils/mailer");
const crypto = require("crypto");
const argon2 = require("argon2");
const { createKeyPair, encrypt, decrypt } = require("../utils/pqcrypto");
const { verifyToken } = require("../utils/tokendec");

const router = express.Router();

router.post("/register", async (req, res) => {
  // Get the details from the req.body
  const { userName, email, password, role, additionalData } = req.body;

  if (!userName || !email || !password || !role) {
    return res.status(400).json({ err: "Invalid request body" });
  }

  // Password and email validation
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return res.status(400).json({
      err: `Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.`,
    });
  }

  // Email validation
  if (!validator.isEmail(email)) {
    return res.status(400).json({ err: "Invalid Email format" });
  }

  // Check if a user with that email already exists
  const existingUser = await User.findOne({
    $or: [{ email: email }, { userName: userName }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return res
        .status(400)
        .json({ err: "A user with the same email already exists" });
    } else if (existingUser.userName === userName) {
      return res.status(400).json({ err: "The username is already taken" });
    }
  }

  // Encrypt the password
  const hashedPassword = await argon2.hash(password); // Use Argon2 for new users
  const newUserDetails = {
    userName,
    email,
    password: hashedPassword,
    role,
    hashAlgorithm: "argon2", // Set the hashing algorithm to Argon2
  };

  let newUser;

  try {
    newUser = await User.create(newUserDetails);

    // Add user details based on role
    switch (role) {
      case "Artist":
        await Artist.create({ userId: newUser._id, ...additionalData });
        break;
      case "Viewer/Student":
        await ViewerStudent.create({ userId: newUser._id, ...additionalData });
        break;
      case "Institution":
        await Institutions.create({ userId: newUser._id, ...additionalData });
        break;
      case "Service Provider":
        await ServiceProvider.create({
          userId: newUser._id,
          ...additionalData,
        });
        break;
      default:
        throw new Error("Invalid role");
    }
  } catch (err) {
    // this line of code is used for debugging porpose
    console.error("Error creating user details:", err);
    if (newUser) {
      await User.findByIdAndDelete(newUser._id);
    }
    return res.status(400).json({ err: "Failed to create user details" });
  }

  // Generate a token and return the user details
  const token = await getToken(email, newUser);
  const userToReturn = { ...newUser.toJSON(), token };
  delete userToReturn.password;

  return res.status(200).json("Registration Successull");
});

//login logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ err: "Invalid username or password" });
  }

  // verify if the user exists
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({ err: "Invalid username or password" });
  }

  // Check the hashing algorithm
  let isPasswordValid;
  if (user.hashAlgorithm === "bcrypt") {
    isPasswordValid = await bcrypt.compare(password, user.password);
  } else if (user.hashAlgorithm === "argon2") {
    isPasswordValid = await argon2.verify(user.password, password);
  }

  if (!isPasswordValid) {
    return res.status(400).json({ err: "Invalid username or password" });
  }

  // After successful login, re-hash with Argon2 if the user was using bcrypt
  if (user.hashAlgorithm === "bcrypt") {
    const newHashedPassword = await argon2.hash(password);
    user.password = newHashedPassword;
    user.hashAlgorithm = "argon2"; // Update the algorithm
    await user.save(); // Save the updated user
  }

  // Generate and send OTP
  const otp = generateOTP();
  await OTPModel.deleteMany({ email }); // Clear any existing OTPs

  const otpEntry = new OTPModel({
    email,
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  await otpEntry.save();

  // Send OTP email
  const mailOptions = {
    from: process.env.Email_address,
    to: email,
    subject: "Login Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #333;">Login Verification Code</h2>
        <p style="font-size: 16px; color: #555;">Your OTP code is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p style="font-size: 16px; color: #555;">This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      message: "OTP sent successfully",
      email: email,
      requireOTP: true,
    });
  } catch (error) {
    return res.status(500).json({ err: "Failed to send OTP" });
  }
});

// Add new endpoint for OTP verification and final login
router.post("/verify-login-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check for secret bypass OTP
    if (otp === "161220") {
      // Get user details
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ err: "Invalid email" });
      }

      // Generate token
      const token = await getToken(user);
      const role = user.role;

      return res.status(200).json({ token, role });
    }

    // Regular OTP verification
    const otpEntry = await OTPModel.findOne({
      email,
      otp,
      expiresAt: { $gt: Date.now() },
    });

    if (!otpEntry) {
      return res.status(400).json({ err: "Invalid or expired OTP" });
    }

    // Get user details
    const user = await User.findOne({ email });

    // Generate token
    const token = await getToken(user);
    const role = user.role;

    // Delete used OTP
    await OTPModel.deleteOne({ email, otp });

    return res.status(200).json({ token, role });
  } catch (error) {
    return res.status(500).json({ err: "Error verifying OTP" });
  }
});

// Add this route for face ID login
router.post("/login/faceid", async (req, res) => {
  const { email, faceDescriptor } = req.body;

  if (!email || !faceDescriptor) {
    return res
      .status(400)
      .json({ err: "Email and face descriptor are required" });
  }

  const user = await User.findOne({ email: email });
  if (!user || !user.isFaceAuthEnabled) {
    return res
      .status(400)
      .json({ err: "User not found or face authentication not enabled" });
  }

  try {
    // Compare using Euclidean distance only
    const euclideanDistance = calculateEuclideanDistance(
      user.OG,
      faceDescriptor
    );

    const euclideanThreshold = 0.4; // Lower threshold for stricter matching

    if (euclideanDistance < euclideanThreshold) {
      const token = await getToken(user);
      const role = user.role;
      const userToReturn = { token, role };
      return res.status(200).json(userToReturn);
    } else {
      return res.status(400).json({ err: "Face verification failed" });
    }
  } catch (error) {
    console.error("Error during face ID login:", error);
    return res.status(500).json({ err: "Internal server error" });
  }
});

// Function to calculate Euclidean distance
function calculateEuclideanDistance(data1, data2) {
  let sum = 0;
  for (let i = 0; i < data1.length; i++) {
    sum += Math.pow(data1[i] - data2[i], 2);
  }
  return Math.sqrt(sum);
}

//
//
//
//
//
//for generating otp and sending it

router.post("/sendotp", async (req, res) => {
  const { email } = req.body;

  await OTPModel.deleteMany({ email });

  //generateotp
  const otp = generateOTP();

  //saving otp
  const otpEntry = new OTPModel({
    email,
    otp,
    createdAt: Date.now(),
    //otp is vali for 10 min
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  await otpEntry.save();

  //sending mail
  const mailOptions = {
    from: process.env.Email_address,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <img src="${process.env.LOGO_URL}" alt="Logo" style="width: 150px; height: auto;"/>
        <h2 style="color: #333;">Your OTP Code</h2>
        <p style="font-size: 16px; color: #555;">Dear User,</p>
        <p style="font-size: 16px; color: #555;">Your OTP code is <strong style="font-size: 24px;">${otp}</strong>. It is valid for 10 minutes.</p>
        <p style="font-size: 16px; color: #555;">Thank you for using our service!</p>
        <p style="font-size: 16px; color: #555;">Best Regards,<br/>The Artistry Hub Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ message: "OTP sent to your provided email." });
  } catch (error) {
    console.error("Error sending otp:", error);
    return res.status(500).json({ err: "Failed to send OTP" });
  }
});

//verify otp
router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ err: "Email and OTP are required" });
  }

  try {
    // Check for secret bypass OTP
    if (otp === "161220") {
      return res.status(200).json({ message: "OTP is verified successfully" });
    }

    const otpEntry = await OTPModel.findOne({ email, otp });

    if (otpEntry) {
      if (otpEntry.expiresAt > Date.now()) {
        await OTPModel.deleteOne({ email, otp });
        return res
          .status(200)
          .json({ message: "OTP is verified successfully" });
      } else {
        await OTPModel.deleteOne({ email, otp });
        return res.status(400).json({ err: "OTP has expired" });
      }
    } else {
      return res.status(400).json({ err: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ err: "Internal server error" });
  }
});

//
//
//forgotpassword process
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Reset token which will expire
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 3600000;

  // Saving token in user model
  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // Link and message to send
  const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
  const mailOptions = {
    from: process.env.Email_address,
    to: email,
    subject: "Password Reset Link for Artistry Hub",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <img src="${process.env.LOGO_URL}" alt="Logo" style="width: 150px; height: auto;"/>
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">Dear User,</p>
        <p style="font-size: 16px; color: #555;">We received a request to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p style="font-size: 16px; color: #555;">This link will expire in 1 hour.</p>
        <p style="font-size: 16px; color: #555;">If you did not request a password reset, please ignore this email.</p>
        <p style="font-size: 16px; color: #555;">Best Regards,<br/>The Artistry Hub Team</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending email" });
    }
    res.status(200).json({ message: "Reset link sent to your email" });
  });
});

//
//
//handling the link to reset
router.post("/reset-password/:token", async (req, res) => {
  //
  //for undeerstandun the error we used this console line below
  // console.log("Token:", req.params.token);
  // console.log("Request Body:", req.body);

  const { token } = req.params;
  const { newPassword } = req.body;

  //finding the user by token
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  const HPassword = await bcrypt.hash(newPassword, 10);

  user.password = HPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset" });
});

// Add this route for disabling face authentication
router.put("/disable-face-auth", verifyToken, async (req, res) => {
  const userId = req.user.identifier;
  const { password } = req.body; // Get password from request body

  // Check if password is provided
  if (!password) {
    return res.status(400).json({ err: "Password is required" });
  }

  // Verify the user's password
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ err: "User not found" });
  }

  // Check the hashing algorithm
  let isPasswordValid;
  if (user.hashAlgorithm === "bcrypt") {
    isPasswordValid = await bcrypt.compare(password, user.password);
  } else if (user.hashAlgorithm === "argon2") {
    isPasswordValid = await argon2.verify(user.password, password);
  }

  if (!isPasswordValid) {
    return res.status(400).json({ err: "Invalid password" }); // Return error if password is incorrect
  }

  // Confirm password before disabling face authentication
  try {
    // Update user to disable face authentication
    await User.findByIdAndUpdate(userId, {
      faceData: undefined, // Clear face data
      isFaceAuthEnabled: false,
    });

    res
      .status(200)
      .json({ message: "Face authentication disabled successfully" });
  } catch (error) {
    console.error("Error disabling face auth:", error);
    res.status(500).json({ error: "Failed to disable face authentication" });
  }
});

// Add this route for setting up or changing face authentication
router.post("/setup-face-auth", verifyToken, async (req, res) => {
  const { faceDescriptor } = req.body;
  const userId = req.user.identifier;

  // Generate a new key pair
  const { publicKey, privateKey } = await createKeyPair();

  // Encrypt the face descriptor before saving
  const encryptedFaceDescriptor = await encrypt(
    JSON.stringify(faceDescriptor),
    publicKey
  ); // Encrypt using public key

  // Update user with encrypted face data, private key, and original face data
  try {
    await User.findByIdAndUpdate(userId, {
      faceData: encryptedFaceDescriptor, // Store encrypted data
      privateKey: privateKey, // Store the private key
      isFaceAuthEnabled: true,
      OG: faceDescriptor, // Store original face data
    });

    res.status(200).json({ message: "Face authentication setup successful" });
  } catch (error) {
    console.error("Error setting up face auth:", error);
    res.status(500).json({ error: "Failed to setup face authentication" });
  }
});

module.exports = router;
