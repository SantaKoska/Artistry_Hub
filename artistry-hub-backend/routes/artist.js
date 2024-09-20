const express = require("express");
const router = express.Router();
const Profile = require("../models/ProfileModels");
const Artist = require("../models/ArtistModels");
const User = require("../models/UserModel");
const multer = require("multer");

//authentication
const { verifyToken } = require("../utils/tokendec");

// get profile of the user with the help pf the user id we got from bverification and place it in the req
router.get("/artist-profile", verifyToken, async (req, res) => {
  try {
    const user = req.user; // extracted from token
    //
    //
    //
    //for debugging purpose
    // console.log("User_id:", user.identifier);
    //
    //
    const profile = await Profile.findOne({ userId: user.identifier }).populate(
      "userId"
    );
    // console.log(profile);
    const fuser = await User.findOne({ _id: user.identifier });
    const artist = await Artist.findOne({ userId: user.identifier });
    // console.log(artist);
    if (!profile || !artist) {
      return res
        .status(404)
        .json({ err: "Profile or artist information not found" });
    }

    const followerCount = await profile.getNumberOfFollowers();

    res.json({
      ...profile.toObject(),
      ...artist.toObject(),
      //fetch username from User model
      userName: fuser.userName,
      followerCount,
    });
  } catch (error) {
    console.log("Error fetching profile:", error);
    res.status(500).json({ err: "Server error" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "dp/"); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Append timestamp to file name
  },
});
const upload = multer({ storage });

// update profile
router.put(
  "/artist-editprofile",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const user = req.user; // extracted from token
      const { description, artForm, specialisation, userName, profilePicture } =
        req.body;

      // fetch user, profile, and artist
      const userRecord = await User.findById(user.identifier);
      const artist = await Artist.findOne({ userId: user.identifier });
      const profile = await Profile.findOne({ userId: user.identifier });

      if (!userRecord || !artist || !profile) {
        return res
          .status(404)
          .json({ err: "profile, artist, or user not found" });
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

      // check if the userName is being updated and if it was updated more than a week ago
      if (userName && userName !== userRecord.userName) {
        const existinguser = await User.findOne({ userName });
        if (existinguser) {
          return res.status(400).json({
            err: "username already exist, please choose a differnet one",
          });
        }
        if (userRecord.updatedAt < oneWeekAgo) {
          userRecord.userName = userName;
        } else {
          return res.status(403).json({
            err: "you can only update the username once a week",
          });
        }
      }

      // check if the artForm is being updated and if it was updated more than a week ago
      if (artForm && artForm !== artist.artForm) {
        if (artist.updatedAt < oneWeekAgo) {
          artist.artForm = artForm;
        } else {
          return res.status(403).json({
            err: "you can only update the artForm once a week",
          });
        }
      }

      // check if the specialisation is being updated and if it was updated more than a week ago
      if (specialisation && specialisation !== artist.specialisation) {
        if (artist.updatedAt < oneWeekAgo) {
          artist.specialisation = specialisation;
        } else {
          return res.status(403).json({
            err: "you can only update the specialisation once a week",
          });
        }
      }

      // update the description and profile picture without any restrictions
      if (req.file) {
        profile.profilePicture = `/dp/${req.file.filename}`; // Store relative path
      }
      if (description) profile.description = description;

      // save all the changes
      await userRecord.save();
      await artist.save();
      await profile.save();

      res.json({ success: "profile updated successfully" });
    } catch (error) {
      console.error("error updating profile:", error);
      res.status(500).json({ err: "server error" });
    }
  }
);

module.exports = router;
