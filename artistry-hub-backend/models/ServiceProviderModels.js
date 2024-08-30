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
  expertise: {
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

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  ServiceProviderSchema
);

module.exports = ServiceProvider;
