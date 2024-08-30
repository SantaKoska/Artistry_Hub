const express = require("express");
const passport = require("passport");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const User = require("./models/UserModel");
const cors = require("cors");

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
      "@artistry-hub.tec71.mongodb.net/?retryWrites=true&w=majority&appName=Artistry-Hub"
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

//the app losening to the port
app.listen(8000, () => {
  console.log("Server is running on 8000");
});
