const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const validator = require("validator");
const otpGenerater = require("otp-generator");

const User = require("../models/userModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/appError");
const emailServices = require("../servcies/emailServices");

require("dotenv").config();

exports.signup = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return next(new AppError("Email already exists", 400));
  }

  if (!firstName || firstName.length > 40) {
    return next(new AppError("First name should be less then 40"));
  }

  if (!lastName || lastName.length > 40) {
    return next(new AppError("Last name should be less then 40"));
  }

  if (!password || password.length <= 0 || password.length > 20) {
    return next(new AppError("Password should be less then 20."));
  }

  if (!validator.default.isEmail(email)) {
    return next(new AppError("Email is not valid."));
  }

  const normalizedEmail = validator.default.normalizeEmail(email);

  const hashedPassword = await bcrypt.hash(password, 12);

  const username = `@${firstName.toLowerCase()}${uuid.v4().substring(0, 8)}`;

  const otp = otpGenerater.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  const newUser = new User({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
    username,
    otp,
    optExpiresAt: Date.now() + 10 * 60 * 1000, // 10 mintus
  });

  await newUser.save();

  setTimeout(async () => {
    const user = await User.findById(newUser._id);

    if (user && !user.isVerified) {
      await User.deleteOne({ _id: newUser.id });
    }
  }, 10 * 60 * 1000);

  await emailServices.sendOtpVerificationEmail(normalizedEmail, otp);

  res.status(201).json({
    message:
      "Your account has been successfully created. We have sent an OTP to your registered email. So, Please verify your account under 10 min.",
  });
});

exports.verifyAccount = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;

  if (!otp || !email) {
    return next(new AppError("Otp and email field can't be empty."));
  }

  if (!validator.default.isEmail(email)) {
    return next(new AppError("Email is not valid."));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No User Exists with this email."));
  }

  if (user.otp !== otp || user.optExpiresAt < Date.now()) {
    return next(new AppError("OTP is invalid or OTP is expired."));
  }

  user.isVerified = true;
  user.otp = null;
  user.optExpiresAt = null;

  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.status(201).json({
    message: "User has been verified",
    token: token,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  if (!validator.default.isEmail(email)) {
    return next(new AppError("Please provide a valid email", 400));
  }

  const user = await User.findOne({ email });

  if (user.isVerified === false) {
    return next(new AppError("Please verify your account first.", 400));
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 400));
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.status(200).json({
    message: "You are logged in successfully",
    token,
  });
});
