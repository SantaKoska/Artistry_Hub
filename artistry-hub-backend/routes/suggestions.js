const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");
const Artist = require("../models/ArtistModels");
const ViewerStudent = require("../models/Viewer-StudentModel");
const { verifyToken } = require("../utils/tokendec");

// Get user suggestions based on role, art form, and mutual following
router.get("/user-suggestions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.identifier;

    // Fetch the current user's profile
    const currentUser = await User.findById(userId).populate("following");
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the current user's role and art form
    let artForm, role;
    if (currentUser.role === "Artist") {
      const artist = await Artist.findOne({ userId });
      artForm = artist.artForm; // Assuming artForm is a field in Artist model
      role = currentUser.role;
    } else if (currentUser.role === "Viewer/Student") {
      const student = await ViewerStudent.findOne({ userId });
      artForm = student.artForm; // Assuming artForm is a field in ViewerStudent model
      role = currentUser.role;
    } else if (currentUser.role === "Institution") {
      role = currentUser.role;
    }

    // Function to calculate mutual friends
    const calculateMutualFriends = async (currentUserId, userId) => {
      // Fetch the current user's following
      const currentUser = await User.findById(currentUserId).populate(
        "following"
      );
      const targetUser = await User.findById(userId).populate("following");

      if (!currentUser || !targetUser) return 0;

      // Get the IDs of the users followed by the current user and the target user
      const currentUserFollowingIds = currentUser.following.map((f) =>
        f._id.toString()
      );
      const targetUserFollowingIds = targetUser.following.map((f) =>
        f._id.toString()
      );

      // Find mutual friends
      const mutualFriends = targetUserFollowingIds.filter((followedUserId) =>
        currentUserFollowingIds.includes(followedUserId)
      );

      return mutualFriends.length;
    };

    // Fetch all users that the current user is not following and exclude the current user
    const allUsers = await User.find({
      _id: {
        $nin: [
          ...currentUser.following.map((f) => f._id), // Exclude followed users
          currentUser._id, // Exclude the current user
        ],
      },
    }).populate("following");

    // Sort users based on role, art form, and mutual following
    const sortedUsers = await Promise.all(
      allUsers.map(async (user) => {
        const mutualFollowerCount = await calculateMutualFriends(
          currentUser._id,
          user._id
        ); // Updated mutual friend calculation

        // Fetch the artForm based on the user's role
        let artForm;
        if (user.role === "Artist") {
          const artist = await Artist.findOne({ userId: user._id });
          artForm = artist ? artist.artForm : null; // Get artForm from Artist model
        } else if (user.role === "Viewer/Student") {
          const student = await ViewerStudent.findOne({ userId: user._id });
          artForm = student ? student.artForm : null; // Get artForm from ViewerStudent model
        }

        // Check if the current user is following this user
        const isFollowing = currentUser.following.some((following) =>
          following._id.equals(user._id)
        );

        return {
          ...user.toObject(),
          mutualFollowerCount, // Updated mutual friend count
          isSameRole: user.role === role,
          isSameArtForm:
            (role === "Artist" && artForm === currentUser.artForm) ||
            (role === "Viewer/Student" && artForm === currentUser.artForm),
          isFollowing,
        };
      })
    );

    sortedUsers.sort((a, b) => {
      // Sort by mutual follower count first
      if (b.mutualFollowerCount !== a.mutualFollowerCount) {
        return b.mutualFollowerCount - a.mutualFollowerCount;
      }
      // Then sort by whether they have the same role
      if (b.isSameRole !== a.isSameRole) {
        return b.isSameRole ? -1 : 1; // Prioritize users with the same role
      }
      // Finally, sort by whether they have the same art form
      return b.isSameArtForm ? -1 : 1; // Prioritize users with the same art form
    });

    // console.log(sortedUsers);

    res.json(sortedUsers);
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Follow/Unfollow a user
router.post("/profile/:username/follow", verifyToken, async (req, res) => {
  try {
    const userToFollow = await User.findOne({
      userName: req.params.username,
    });
    const currentUser = req.user;

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const followRecord = await Follower.findOne({
      followerId: currentUser.identifier,
      followingId: userToFollow._id,
    });

    if (followRecord) {
      // If already following, unfollow the user
      await Follower.findOneAndDelete({
        followerId: currentUser.identifier,
        followingId: userToFollow._id,
      });

      // Update the current user's following list
      await User.findByIdAndUpdate(currentUser.identifier, {
        $pull: { following: userToFollow._id },
      });

      return res.json({
        following: false,
        message: "Unfollowed successfully",
      });
    } else {
      // If not following, create a new follower document
      const newFollow = new Follower({
        followerId: currentUser.identifier,
        followingId: userToFollow._id,
      });
      await newFollow.save();

      // Update the current user's following list
      await User.findByIdAndUpdate(currentUser.identifier, {
        $addToSet: { following: userToFollow._id },
      });

      return res.json({ following: true, message: "Followed successfully" });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
