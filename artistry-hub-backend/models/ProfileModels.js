const mongoose = require("mongoose");
const Follower = require("./FollowerModels");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    profilePicture: {
      type: String,
      default: "/dp/default-profile.png",
    },
    description: {
      type: String,
      default: "",
    },
    numberOfPosts: {
      type: Number,
      default: 0,
    },
    posts: [
      {
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Middleware to update numberOfPosts based on posts array length
profileSchema.pre("save", function (next) {
  this.numberOfPosts = this.posts.length;
  next();
});

//for counting the followers numberreq.accepts(profileSchema.methods.getNumberOfFollowers = async function () {
profileSchema.methods.getNumberOfFollowers = async function () {
  const count = await Follower.countDocuments({ followingId: this._id });
  return count;
};

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
