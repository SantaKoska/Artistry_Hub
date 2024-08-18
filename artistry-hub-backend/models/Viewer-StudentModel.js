const mongoose = require("mongoose");

const viewerstudentschema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  FavArtform: [String],

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
