const mongoose = require("mongoose");
const Follower = require("./FollowerModels");

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Artist", "Viewer/Student", "Institution", "Service Provider"],
      required: true,
    },
    resetToken: {
      type: String,
      required: false,
    },
    resetTokenExpiry: {
      type: Date,
      required: false,
    },
    profilePicture: {
      type: String,
      default: "/dp/default-profile.png",
    },
    description: {
      type: String,
      default: "",
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
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashAlgorithm: {
      type: String,
      required: true,
      default: "bcrypt",
    },
    faceData: {
      type: {
        encryptedData: String,
        iv: String,
        authTag: String,
        encapsulatedKey: String,
      },
      default: null,
    },
    isFaceAuthEnabled: {
      type: Boolean,
      default: false,
    },
    privateKey: {
      type: String,
      required: false,
      select: false, // Hide private key from query results by default
    },
    OG: {
      type: Array, // Store face descriptor as array for Euclidean distance calculation
      select: false, // Hide original descriptor from query results by default
      default: null,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual for counting the number of posts
UserSchema.virtual("numberOfPosts").get(function () {
  return this.posts ? this.posts.length : 0;
});

// method for counting the number of followers
UserSchema.methods.getNumberOfFollowers = async function () {
  const count = await Follower.countDocuments({ followingId: this._id });
  return count;
};

// Model
const User = mongoose.model("User", UserSchema);

module.exports = User;
