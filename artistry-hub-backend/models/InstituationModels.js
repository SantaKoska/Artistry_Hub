const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  registeredUnder: {
    type: String,
    trim: true,
  },
  registrationID: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    address: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
});

const Institution = mongoose.model("Institution", InstitutionSchema);

module.exports = Institution;
