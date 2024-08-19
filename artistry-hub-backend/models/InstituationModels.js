const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  universityAffiliation: {
    type: String,
    trim: true,
  },
  registrationID: {
    type: String,
    required: true,
    trim: true,
  },
});

const Institution = mongoose.model("Institution", InstitutionSchema);

module.exports = Institution;
