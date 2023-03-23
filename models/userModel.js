const validator = require("validator");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: {
      validator: (value) => {
        return validator.default.isEmail;
      },
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unquie: true,
  },
  profile: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  optExpiresAt: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  uploadedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  dislikedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  commented: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  commentReplied: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
