const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpVerificationEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: "abhishekchamoli007@gmail.com",
      to: email,
      subject: "Verify Your Account",
      text: `Your verification code is ${otp} `,
      html: `Your verification code is <b>${otp}</b>`,
    });
  } catch (err) {
    console.log(err);
  }
};
