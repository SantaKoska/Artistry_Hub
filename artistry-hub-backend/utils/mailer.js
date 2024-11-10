const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
require("dotenv").config();

//config transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_address,
    pass: process.env.Email_Password,
  },
});

const generateOTP = () => {
  return otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
};

module.exports = { generateOTP, transporter };
