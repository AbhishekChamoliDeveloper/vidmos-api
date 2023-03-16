const express = require("express");

const userControllers = require("../controllers/userController.js");
const authMiddlewares = require("../middlewares/authMiddlewares.js");
const profileUploader = require("../middlewares/profileUploader");

const router = express.Router();

router
  .route("/update-info")
  .post(authMiddlewares.protect, userControllers.updateBasicInformation);

router
  .route("/forgot-password-otp")
  .post(userControllers.forgotPasswordSendOtp);

router.route("/reset-password").post(userControllers.forgotResetPassword);

router
  .route("/delete-account")
  .delete(authMiddlewares.protect, userControllers.deleteAccount);

router
  .route("/update-profile")
  .post(
    authMiddlewares.protect,
    profileUploader.single("profile"),
    userControllers.updateProfile
  );

module.exports = router;
