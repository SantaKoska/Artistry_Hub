const mongoose = require("mongoose");

//Schema for User

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["Artist", "Viewer/Student", "Institution", "Service Provider"],
    required: true,
  },
});

//model
const User = mongoose.model("User", UserSchema);

module.exports = User;
