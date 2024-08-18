const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  KnownArtForm: [String],

  teachingCourse: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

const Artist = mongoose.model("Artist", artistSchema);

module.exports = Artist;
