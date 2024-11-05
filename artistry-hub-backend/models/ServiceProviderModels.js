const mongoose = require("mongoose");

const ServiceProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
      // this line of code will help to remove the non-alphabet and unwanted spaces
      let cleanedArtForm = input
        .replace(/[^a-zA-Z\s]/g, "")
        .trim()
        .replace(/\s+/g, " "); // Replaces multiple spaces with a single space

      // now we need to update the data by converting the 1st letter to capital and the remaining to lower case
      return (
        cleanedArtForm.charAt(0).toUpperCase() +
        cleanedArtForm.slice(1).toLowerCase()
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
  ignoredServiceRequests: {
    type: [mongoose.Schema.Types.ObjectId], // Assuming it's an array of ObjectIds referencing service requests
    ref: "ServiceRequest", // Reference to the service request model
  },
});

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  ServiceProviderSchema
);

module.exports = ServiceProvider;
