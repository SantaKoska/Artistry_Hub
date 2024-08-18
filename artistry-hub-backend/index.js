const express = require("express");
const passport = require("passport");
const { ExtractJwt, JwtStrategy } = require("passport-jwt");
const mongoose = require("mongoose");
require("dotenv").config();
 
const app = express();

//to connect to mongodb
mongoose
  .connect(
    "mongodb+srv://kamalsankarm:" +
      process.env.MONGO_PASSWORD +
      "@artistry-hub.tec71.mongodb.net/?retryWrites=true&w=majority&appName=Artistry-Hub",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then((x) => {
    console.log("Connect to mongo!");
  })
  .catch((err) => {
    console.log("Error occured while connecting to mongo");
    console.log(err);
  });

//passport-jwt setup
let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secret = "thisisasecretKey";
passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    User.findOne({ _id: jwt_payload.identifier }, function (err, done) {
      if (err) {
        done(err, false);
      }
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
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

//the app losening to the port
app.listen(8000, () => {
  console.log("Sercer is running");
});
