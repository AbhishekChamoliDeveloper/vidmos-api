const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/appError");

exports.readNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const { _id } = req.user;

  const notification = await Notification.findById(notificationId);

  if (_id !== notification.recipientId) {
    return next(new AppError("Only Recipient can saw this notification.", 400));
  }

  if (!notification) {
    return next(new AppError("No Notification Found with this Id", 400));
  }

  notification.isRead = true;

  await notification.save();

  res.status(202).json({
    success: true,
    message: "Notification status has been read",
  });
});
