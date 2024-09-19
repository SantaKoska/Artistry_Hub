const mongoose = require("mongoose");

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
      default: "/images/default-profile.png",
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
        preview: {
          type: String,
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

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
