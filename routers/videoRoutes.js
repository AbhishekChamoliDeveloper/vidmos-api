const express = require("express");

const videoController = require("../controllers/videoController");
const authMiddlewares = require("../middlewares/authMiddlewares.js");
const videoUploader = require("../middlewares/videoUploader");

const router = express.Router();

router
  .route("/upload-video")
  .post(
    authMiddlewares.protect,
    videoUploader.single("video"),
    videoController.uploadVideo
  );

router
  .route("/:id")
  .get(authMiddlewares.protect, videoController.getVideo)
  .patch(authMiddlewares.protect, videoController.updateVideoInfo)
  .delete(authMiddlewares.protect, videoController.deleteVideo);

module.exports = router;
