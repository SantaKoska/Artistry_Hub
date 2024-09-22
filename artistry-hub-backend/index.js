const express = require("express");
const passport = require("passport");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const artistRoutes = require("./routes/artist");
const post = require("./routes/post");
const commonthings = require("./routes/common");
const User = require("./models/UserModel");
const cors = require("cors");
const path = require("path");

//for env
require("dotenv").config();

const app = express();

//for CORS
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

//to connect to mongodb
mongoose
  .connect(
    "mongodb+srv://kamalsankarm:" +
      process.env.MONGO_PASSWORD +
      "@artistry-hub.tec71.mongodb.net/ArtistryHub?retryWrites=true&w=majority&appName=Artistry-Hub"
  )
  .then((x) => {
    console.log("Connected to mongo!");
  })
  .catch((err) => {
    console.log("Error occured while connecting to mongo");
    console.log(err);
  });

//passport-jwt setup decoding
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = "thisisasecretKey";
passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findOne({ _id: jwt_payload.identifier });
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      if (err) {
        done(err, false);
      }
    }
  })
);

app.use(passport.initialize());

app.use("/dp", express.static(path.join(__dirname, "dp")));

// serve post images, videos, and audio files
app.use("/post/image", express.static(path.join(__dirname, "post/image")));
app.use("/post/video", express.static(path.join(__dirname, "post/video")));
app.use("/post/audio", express.static(path.join(__dirname, "post/audio")));

//default route
app.get("/", (req, res) => {
  res.send("I am Working");
});

// defining a route
app.get("/hello", (req, res) => {
  res.send("hello World, This is a new route");
});

//using if the auth.js
app.use("/auth", authRoutes);

app.use("/common-things", commonthings);

app.use("/artist", artistRoutes);

app.use("/posts", post);

//the app losening to the port
app.listen(8000, () => {
  console.log("Server is running on 8000");
});
