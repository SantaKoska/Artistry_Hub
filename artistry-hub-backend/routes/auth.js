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
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserDetails = {
    userName,
    email,
    password: hashedPassword,
    role,
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
  //Get the details from the body
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ err: "Invalid username or password" });
  }
  //verify if the user exist
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({ err: "Invalid username or password" });
  }

  //verify the coreesponding password is crct
  //can't verify directly encryption
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ err: "Invalid username or password" });
  }

  //generate token fro this user
  const token = await getToken(user);

  // GET ROLE
  const role = user.role;

  //sending JSON as responce
  const userToReturn = { token, role };
  delete userToReturn.password;

  return res.status(200).json(userToReturn);
});
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
    text: `Your OTP code is ${otp}. It is valid for 10 min`,
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
    return res.status(400).json({ message: "Useer not found" });
  }

  // reset token which will expire
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 3600000;

  //storing token in user module
  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // link and message to send
  const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
  const message = `Click the link below to reset your password:\n\n${resetLink}`;

  const mailOptions = {
    from: process.env.Email_address,
    to: email,
    subject: "Password Reset link for Artistry Hub",
    text: message,
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
module.exports = router;
