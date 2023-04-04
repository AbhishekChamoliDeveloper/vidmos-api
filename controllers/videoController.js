const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const mongoose = require("mongoose");

const Video = require("../models/videoModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/appError");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const Reply = require("../models/replyModel");
const Notification = require("../models/notificationModel");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoToUpload = req.file;

  const { title, description, category } = req.body;

  if (!videoToUpload) {
    return next(new AppError("Please upload a file", 400));
  }

  const user = await User.findById(_id);

  if (!user) {
    return next(new AppError("Invalid Account login or signup first"));
  }

  const videoName = `${user._id}-${uuid.v4()}-${Date.now()}-${
    videoToUpload.originalname
  }`;

  const cloudinaryStream = cloudinary.uploader.upload_stream(
    {
      folder: "Dev",
      public_id: videoName,
      resource_type: "video",
      chunk_size: 60000000,
    },
    async (error, result) => {
      if (error) {
        console.log(error);
        return next(new AppError("Error upload video", 500));
      } else {
        const video = new Video({
          title,
          description,
          category,
          uploadedBy: user._id,
          fileUrl: result.secure_url,
        });

        JSON.parse(req.body.keywords).forEach((keyword) => {
          video.keywords.push(keyword);
        });

        await video.save();

        user.uploadedVideos.push(video._id);
        await user.save();

        res.status(201).json({
          status: "success",
          message: "Video has been uploaded",
          data: {
            video,
          },
        });
      }
    }
  );

  streamifier.createReadStream(videoToUpload.buffer).pipe(cloudinaryStream);
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;

  const video = await Video.findById(videoId).populate(
    "uploadedBy",
    "_id firstName lastName email username"
  );

  if (!video) {
    return next(new AppError("Video not found with this Id."));
  }

  video.views++;
  await video.save();

  res.status(200).json(video);
});

exports.deleteVideo = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.id;

  const video = await Video.findById(videoId);

  if (!video) {
    return next(new AppError("Video not found with this Id"));
  }

  const user = await User.findOne({ _id });

  if (!user) {
    return next(new AppError("Invalid Account login or Singup first"));
  }

  if (!user.uploadedVideos.includes(videoId)) {
    return next(
      new AppError(
        "Warning! Only Owner can delete this video. You should have to be in this route."
      )
    );
  }

  await Video.deleteOne({ _id: videoId });
  await User.updateOne({ _id }, { $pull: { uploadedVideos: videoId } });

  res.status(204).json({});
});

exports.updateVideoInfo = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;
  const { _id } = req.user;
  const { title, description, category, keywords } = req.body;

  const video = await Video.findById(videoId);

  if (!video) {
    return next(new AppError("Video not found with this Id"));
  }

  const user = await User.findOne({ _id });

  if (!user) {
    return next(new AppError("Invalid Account login or Singup first"));
  }

  if (!user.uploadedVideos.includes(videoId)) {
    return next(
      new AppError(
        "Warning! Only Owner can delete this video. You should have to be in this route."
      )
    );
  }

  video.title = title;
  video.description = description;
  video.category = category;
  video.keywords = keywords;

  await video.save();

  res.status(200).json({
    status: "success",
    messsage: "Video information has been updated",
  });
});

exports.likeVideo = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.id;

  const video = await Video.findById(videoId);

  if (!video) {
    return next(new AppError("Video not found with this Id"));
  }

  const user = await User.findOne({ _id });

  if (!user) {
    return next(new AppError("Invalid Account login or Singup first"));
  }

  if (video.usersLikedThisVideo.includes(_id)) {
    video.likes--;

    let userIdIndex = video.usersLikedThisVideo.indexOf(_id);
    let videoIdIndex = user.likedVideos.indexOf(videoId);

    video.usersLikedThisVideo.splice(userIdIndex, 1);
    user.likedVideos.splice(videoIdIndex, 1);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  } else if (video.usersDislikedThisVideo.includes(_id)) {
    video.likes++;
    video.dislike--;

    let userIdIndex = video.usersDislikedThisVideo.indexOf(_id);
    let videoIdIndex = user.dislikedVideos.indexOf(videoId);

    video.usersDislikedThisVideo.splice(userIdIndex, 1);
    video.usersLikedThisVideo.push(_id);

    user.dislikedVideos.splice(videoIdIndex, 1);
    user.likedVideos.push(videoId);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  } else {
    video.likes++;

    video.usersLikedThisVideo.push(_id);
    user.likedVideos.push(videoId);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  }
});

exports.dislikeVideo = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.id;

  const video = await Video.findById(videoId);

  if (!video) {
    return next(new AppError("Video not found with this Id"));
  }

  const user = await User.findOne({ _id });

  if (!user) {
    return next(new AppError("Invalid Account login or Singup first"));
  }

  if (video.usersDislikedThisVideo.includes(_id)) {
    video.dislike--;

    let userIdIndex = video.usersDislikedThisVideo.indexOf(_id);
    let videoIdIndex = user.dislikedVideos.indexOf(videoId);

    video.usersDislikedThisVideo.splice(userIdIndex, 1);
    user.dislikedVideos.splice(videoIdIndex, 1);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  } else if (video.usersLikedThisVideo.includes(_id)) {
    video.likes--;
    video.dislike++;

    let userIdIndex = video.usersLikedThisVideo.indexOf(_id);
    let videoIdIndex = user.likedVideos.indexOf(videoId);

    video.usersLikedThisVideo.splice(userIdIndex, 1);
    video.usersDislikedThisVideo.push(_id);

    user.likedVideos.splice(videoIdIndex, 1);
    user.dislikedVideos.push(videoId);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  } else {
    video.dislike++;

    video.usersDislikedThisVideo.push(_id);
    user.dislikedVideos.push(videoId);

    await user.save();
    await video.save();

    const updatedVideo = await Video.findById(videoId).select(
      "-usersDislikedThisVideo -usersLikedThisVideo -__v"
    );

    res.status(202).json(updatedVideo);
  }
});

exports.createComment = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.id;

  const video = await Video.findById(videoId);
  const user = await User.findById(_id);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  const { text } = req.body;

  if (text.length <= 0) {
    return next(new AppError("Comment text length cann't be null", 400));
  }

  const newComment = await Comment.create({
    videoId: videoId,
    author: _id,
    text: text,
  });

  video.comments.push(newComment._id);
  user.commented.push(newComment._id);

  await video.save();
  await user.save();

  // Creating Notification for Video Owner
  const recipientId = video.uploadedBy;

  const notificationBody = {
    recipientId,
    title: `${user.username} is commented.`,
    description: newComment.text,
  };

  const newNotification = await Notification.create(notificationBody);

  const videoOwner = await User.findById(recipientId);

  videoOwner.notifications.push(newNotification._id);

  await videoOwner.save();

  res.status(201).json({
    status: "success",
    data: newComment,
  });
});

exports.createReply = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.videoId;
  const commentId = req.params.commentId;
  const { text } = req.body;

  const video = await Video.findById(videoId);
  const comment = await Comment.findById(commentId);
  const user = await User.findById(_id);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  if (!video.comments.includes(commentId)) {
    return next(
      new AppError("Comment and Video are not related to each other.", 400)
    );
  }

  const reply = await Reply.create({
    author: _id,
    text: text,
    videoId: videoId,
    parentComment: commentId,
    parentReply: null,
  });

  comment.replies.push(reply._id);
  user.commentReplied.push(reply._id);

  await comment.save();
  await user.save();

  res.status(201).json({
    status: "success",
    data: reply,
  });
});

exports.createChildReply = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.videoId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const { text } = req.body;

  const user = await User.findById(_id);
  const video = await Video.findById(videoId);
  const comment = await Comment.findById(commentId);
  const reply = await Reply.findById(replyId);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  if (!reply) {
    return next(new AppError("Reply not found with this Id", 400));
  }

  if (!video.comments.includes(commentId)) {
    return next(
      new AppError("Comment and Video are not related to each other.", 400)
    );
  }

  if (!comment.replies.includes(replyId)) {
    return next(
      new AppError("Comment and Reply are not related to each other.", 400)
    );
  }

  const newReply = await Reply.create({
    author: _id,
    text: text,
    videoId: videoId,
    parentComment: commentId,
    parentReply: replyId,
  });

  reply.childReplies.push(newReply._id);
  user.replyReplied.push(newReply._id);

  await user.save();
  await reply.save();

  res.status(201).json({
    status: "success",
    data: newReply,
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.videoId;
  const commentId = req.params.commentId;

  const video = await Video.findById(videoId);
  const comment = await Comment.findById(commentId);
  const user = await User.findById(_id);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  if (user.uploadedVideos.includes(videoId)) {
    if (!video.comments.includes(commentId)) {
      return next(new AppError("Comment and Video are not related", 400));
    }

    await Video.updateOne({ _id: videoId }, { $pull: { comments: commentId } });
    await User.updateOne({ _id }, { $pull: { commented: commentId } });

    const replyIds = await Reply.aggregate([
      { $match: { parentComment: new mongoose.Types.ObjectId(commentId) } },
      { $project: { _id: 1 } },
    ]);

    const replyIdsToDelete = replyIds.map((reply) => {
      return reply._id;
    });

    await Reply.deleteMany({ _id: { $in: replyIdsToDelete } });

    await User.updateMany(
      {
        $or: [
          { commentReplied: { $in: replyIdsToDelete } },
          { replyReplied: { $in: replyIdsToDelete } },
        ],
      },
      {
        $pull: {
          commentReplied: { $in: replyIdsToDelete },
          replyReplied: { $in: replyIdsToDelete },
        },
      }
    );

    await Comment.deleteOne({ _id: commentId });

    res.status(204).json({});
  } else {
    if (!user.commented.includes(commentId)) {
      return next(
        new AppError("Only comment owner can delete the comment", 400)
      );
    }

    if (!video.comments.includes(commentId)) {
      return next(new AppError("Comment and Video are not related", 400));
    }

    await Video.updateOne({ _id: videoId }, { $pull: { comments: commentId } });
    await User.updateOne({ _id }, { $pull: { commented: commentId } });

    const replyIds = await Reply.aggregate([
      { $match: { parentComment: new mongoose.Types.ObjectId(commentId) } },
      { $project: { _id: 1 } },
    ]);

    const replyIdsToDelete = replyIds.map((reply) => {
      return reply._id;
    });

    await Reply.deleteMany({ _id: { $in: replyIdsToDelete } });

    await User.updateMany(
      {
        $or: [
          { commentReplied: { $in: replyIdsToDelete } },
          { replyReplied: { $in: replyIdsToDelete } },
        ],
      },
      {
        $pull: {
          commentReplied: { $in: replyIdsToDelete },
          replyReplied: { $in: replyIdsToDelete },
        },
      }
    );

    await Comment.deleteOne({ _id: commentId });

    res.status(204).json({});
  }
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const videoId = req.params.videoId;
  const commentId = req.params.commentId;
  const { text } = req.body;

  const video = await Video.findById(videoId);
  const comment = await Comment.findById(commentId);
  const user = await User.findById(_id);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  if (!user.commented.includes(commentId)) {
    return next(new AppError("Only comment owner can delete the comment", 400));
  }

  if (!video.comments.includes(commentId)) {
    return next(new AppError("Comment and Video are not related", 400));
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId },
    { text: text },
    { new: true }
  );

  res.status(201).json({
    success: "true",
    data: updatedComment,
  });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const commentId = req.params.commentId;

  const comment = await Comment.findById({ _id: commentId });

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  res.status(201).json({
    success: "true",
    data: comment,
  });
});

exports.deleteReply = catchAsync(async (req, res, next) => {
  const videoId = req.params.videoId;
  const commentId = req.params.commentId;
  const replyId = req.params.replyId;
  const { _id } = req.user;

  const video = await Video.findById(videoId);
  const comment = await Comment.findById(commentId);
  const reply = await Reply.findById(replyId);
  const user = await User.findById(_id);

  if (!video) {
    return next(new AppError("Video not found with this Id", 400));
  }

  if (!comment) {
    return next(new AppError("Comment not found with this Id", 400));
  }

  if (!video.comments.includes(commentId)) {
    return next(new AppError("Comment and Video are not related", 400));
  }

  if (!user.commentReplied.includes(replyId)) {
    return next(new AppError("Only owner of the reply can delete it."));
  }

  if (!comment.replies.includes(replyId)) {
    return next(
      new AppError("Video, Comment or reply are not related to each other")
    );
  }

  await Comment.updateOne({ _id: commentId }, { $pull: { replies: replyId } });

  const childRepliesIds = await Reply.aggregate([
    { $match: { parentReply: new mongoose.Types.ObjectId(replyId) } },
    { $project: { _id: 1 } },
  ]);

  const childRepliesIdsToDelete = childRepliesIds.map((reply) => {
    return reply._id;
  });

  childRepliesIdsToDelete.push(replyId);

  await User.updateMany(
    {
      $or: [
        { commentReplied: { $in: childRepliesIdsToDelete } },
        { replyReplied: { $in: childRepliesIdsToDelete } },
      ],
    },
    {
      $pull: {
        commentReplied: { $in: childRepliesIdsToDelete },
        replyReplied: { $in: childRepliesIdsToDelete },
      },
    }
  );

  await Reply.deleteMany({ _id: { $in: childRepliesIdsToDelete } });

  await Reply.deleteOne({ _id: replyId });

  res.status(204).json({});
});
