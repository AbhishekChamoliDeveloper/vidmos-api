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

router
  .route("/like/:id")
  .patch(authMiddlewares.protect, videoController.likeVideo);

router
  .route("/dislike/:id")
  .patch(authMiddlewares.protect, videoController.dislikeVideo);

router
  .route("/:id/comment")
  .post(authMiddlewares.protect, videoController.createComment);

router
  .route("/:videoId/comment/:commentId/reply")
  .post(authMiddlewares.protect, videoController.createReply);

router
  .route("/:videoId/comment/:commentId/reply/:replyId/reply")
  .post(authMiddlewares.protect, videoController.createChildReply);

router
  .route("/:videoId/comment/:commentId")
  .get(authMiddlewares.protect, videoController.getComment)
  .patch(authMiddlewares.protect, videoController.updateComment)
  .delete(authMiddlewares.protect, videoController.deleteComment);

router
  .route("/:videoId/comment/:commentId/reply/:replyId")
  .delete(authMiddlewares.protect, videoController.deleteReply);

module.exports = router;
