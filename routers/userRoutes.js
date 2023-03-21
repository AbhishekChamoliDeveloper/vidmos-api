const express = require("express");

const userControllers = require("../controllers/userController.js");
const authMiddlewares = require("../middlewares/authMiddlewares.js");
const profileUploader = require("../middlewares/profileUploader");

const router = express.Router();

router
  .route("/update-info")
  .patch(authMiddlewares.protect, userControllers.updateBasicInformation);

router
  .route("/forgot-password-otp")
  .post(userControllers.forgotPasswordSendOtp);

router.route("/reset-password").post(userControllers.forgotResetPassword);

router
  .route("/delete-account")
  .delete(authMiddlewares.protect, userControllers.deleteAccount);

router
  .route("/update-profile")
  .patch(
    authMiddlewares.protect,
    profileUploader.single("profile"),
    userControllers.updateProfile
  );

router
  .route("/get-profile-by-id/:id")
  .get(authMiddlewares.protect, userControllers.getProfileById);

router
  .route("/get-profile-by-username/:username")
  .get(authMiddlewares.protect, userControllers.getProfileByUsername);

module.exports = router;
