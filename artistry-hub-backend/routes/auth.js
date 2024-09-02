const express = require("express");
const User = require("../models/UserModel");
const Artist = require("../models/ArtistModels");
const ServiceProvider = require("../models/ServiceProviderModels");
const Institutions = require("../models/InstituationModels");
const ViewerStudent = require("../models/Viewer-StudentModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { getToken } = require("../utils/helper");

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
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res
      .status(400)
      .json({ err: "A user with the same email id already exists" });
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

  return res.status(200).json(userToReturn);
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
  const token = await getToken(email, user);
  const userToReturn = { ...user.toJSON(), token };
  delete userToReturn.password;
  return res.status(200).json(userToReturn);
});

module.exports = router;
