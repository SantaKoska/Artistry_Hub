const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  KnownFormsofArt: {
    type: String,
    enum: [
      "Paintind",
      "Sculpture",
      "Architecture",
      "Literature",
      "Cinema",
      "Theater",
      "Music",
    ],
    required: true,
  },
  Specialisation: {
    type: [String],
    required: true,
    set: (artform) => {
      //each elemets inside the array is taken and converted
      return artform.map((artform) => {
        //this line code will help to remove the non alphabet and unwanded space
        let cleanedartform = artform
          .replace(/[^a-zA-Z\s]/g, "")
          .trim()
          .replace(/\s/g, "");

        //now we need to update the data by convertimg the 1st letter to cap and remaining to lower case
        return (
          cleanedartform.charAt(0).toUpperCase() +
          cleanedartform.slice(1).toLowerCase()
        );
      });
    },
  },

  teachingCourse: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

const Artist = mongoose.model("Artist", artistSchema);

module.exports = Artist;
