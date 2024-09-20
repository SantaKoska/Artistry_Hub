const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
        "Theater",
        "Music",
      ],
      required: true,
    },
    specialisation: {
      type: String,
      required: true,
      set: (input) => {
        //this line code will help to remove the non alphabet and unwanded space
        let cleanedartform = input
          .replace(/[^a-zA-Z\s]/g, "")
          .trim()
          .replace(/\s/g, "");

        //now we need to update the data by convertimg the 1st letter to cap and remaining to lower case
        return (
          cleanedartform.charAt(0).toUpperCase() +
          cleanedartform.slice(1).toLowerCase()
        );
      },
    },

    teachingCourse: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

const Artist = mongoose.model("Artist", artistSchema);

module.exports = Artist;
