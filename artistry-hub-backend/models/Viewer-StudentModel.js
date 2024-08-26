const mongoose = require("mongoose");

const viewerstudentschema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  artForm: {
    type: String,
    enum: [
      "Painting",
      "Sculpture",
      "Architecture",
      "Literature",
      "Cinema",
      "Theatre",
      "Music",
    ],
    required: true,
  },

  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  completedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

const Viewerstudent = mongoose.model("ViewerStudent", viewerstudentschema);

module.exports = Viewerstudent;
