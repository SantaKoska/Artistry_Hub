const express = require("express");
const passport = require("passport");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const artistRoutes = require("./routes/artist");
const studentRoutes = require("./routes/student");
const post = require("./routes/post");
const commonthings = require("./routes/common");
const message = require("./routes/message");
const User = require("./models/UserModel");
const cors = require("cors");
const path = require("path");
const service = require("./routes/service");
const institution = require("./routes/instituation");
const suggestionsRoutes = require("./routes/suggestions");
const comment = require("./routes/comments");
const instrumentservice = require("./routes/instrumentServiceAssistant");
const events = require("./routes/events");
const jobs = require("./routes/jobs");

//for env
require("dotenv").config();

const app = express();

//for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://artistry-hub-1.onrender.com",
];

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin, like mobile apps or curl requests
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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

app.use("/learning", express.static(path.join(__dirname, "learning")));

app.use("/Service", express.static(path.join(__dirname, "Service")));

app.use("/events", express.static(path.join(__dirname, "events")));

app.use("/resumes", express.static(path.join(__dirname, "resumes")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// serve post images, videos, and audio files
app.use("/storage", express.static(path.join(__dirname, "../storage")));
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

app.use("/message", message);

app.use("/student", studentRoutes);

app.use("/service", service);

app.use("/institution", institution);

app.use("/suggestions", suggestionsRoutes);

app.use("/comments", comment);

app.use("/instrumentservice", instrumentservice);

app.use("/events", events);

app.use("/jobs", jobs);

//the app losening to the port
app.listen(8000, () => {
  console.log("Server is running on 8000");
});
