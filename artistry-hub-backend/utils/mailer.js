const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const emailTemplates = require("./emailTemplates");
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

const sendClassNotification = async (type, data) => {
  try {
    const template = emailTemplates[type](
      data.userName,
      data.className,
      data.dateTime,
      data.artistName,
      data.classLink
    );

    const mailOptions = {
      from: process.env.Email_address,
      to: data.email,
      subject: template.subject,
      html: template.html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
};

module.exports = { generateOTP, transporter, sendClassNotification };
