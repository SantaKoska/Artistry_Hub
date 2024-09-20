const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference follower
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // refernece to following
      required: true,
    },
  },
  { timestamps: true }
);

//one user can follow anothe user once
followerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follower = mongoose.model("Follower", followerSchema);

module.exports = Follower;
