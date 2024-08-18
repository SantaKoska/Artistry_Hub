const express = require("express");
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { getToken } = require("../utils/helper");

const router = express.Router();

router.post("/register", async (req, res) => {
  //This is the function that handle the register user logic

  //Get the details from the req.body
  const { firstName, lastName, email, password, userType } = req.body;
  if (!firstName || !email || !password || !userType) {
    return res.status(400).json({ err: "Invalid request body" });
  }

  //password and email validation
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return res
      .status(400)
      .json({
        err: `Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.`,
      });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ err: "Invalid Email format" });
  }

  //We will check if a user with that email already exists
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res
      .status(402)
      .json({ err: "A user with the same email id already exicts" });
  }

  //if this is a correct user we will create a user
  //this gonna encrypt the password given by the user that gonna store in the db
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserDetails = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    userType,
  };
  const newUser = await User.create(newUserDetails);

  //i can use the newuser to create a JWT and return the token to the user
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
    return res.status(401).json({ err: "Invalid username or password" });
  }

  //generate token fro this user
  const token = await getToken(email, user);
  const userToReturn = { ...user.toJSON(), token };
  delete userToReturn.password;
  return res.status(200).json(userToReturn);
});

module.exports = router;
