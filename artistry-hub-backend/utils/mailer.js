const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
require("dotenv").config();

//config transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kamalsankarm2025@mca.ajce.in",
    pass: process.env.Email_Password,
  },
});

const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });
};

module.exports = { generateOTP, transporter };
