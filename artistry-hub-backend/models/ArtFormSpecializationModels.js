const mongoose = require("mongoose");

const ArtFormSpecializationSchema = new mongoose.Schema({
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
  specializations: [
    {
      type: String,
      required: true,
    },
  ],
});

const ArtFormSpecialization = mongoose.model(
  "ArtFormSpecialization",
  ArtFormSpecializationSchema
);

module.exports = ArtFormSpecialization;
