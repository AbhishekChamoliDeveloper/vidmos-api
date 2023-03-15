const express = require("express");

const userControllers = require("../controllers/userController.js");
const authMiddlewares = require("../middlewares/authMiddlewares.js");

const router = express.Router();

router
  .route("/update-info")
  .post(authMiddlewares.protect, userControllers.updateBasicInformation);

router
  .route("/forgot-password-otp")
  .post(userControllers.forgotPasswordSendOtp);

router.route("/reset-password").post(userControllers.forgotResetPassword);

module.exports = router;
