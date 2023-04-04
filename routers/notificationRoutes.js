const express = require("express");

const authMiddlewares = require("../middlewares/authMiddlewares.js");
const notificationController = require("../controllers/notificationController.js");

const router = express.Router();

router
  .route("/read-notification/:id")
  .patch(authMiddlewares.protect, notificationController.readNotification);

module.exports = router;
