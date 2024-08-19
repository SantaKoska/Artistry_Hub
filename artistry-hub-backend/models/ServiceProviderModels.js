const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
    trim: true,
  },
  expertise: [String],

  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
});

const ServiceProvider = mongoose.model("ServiceProvider", ServiceProviderSchema);

module.exports = ServiceProvider;
