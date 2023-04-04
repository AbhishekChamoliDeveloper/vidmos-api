const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routers/authRoutes");
const userRoutes = require("./routers/userRoutes");
const videoRoutes = require("./routers/videoRoutes");
const notificationRoutes = require("./routers/notificationRoutes");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const deleteUnverifiedUserAgenda = require("./servcies/deleteUnverifiedUserAgenda");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected To Database");
  })
  .catch((err) => {
    console.log(err);
  });

(async () => {
  try {
    await deleteUnverifiedUserAgenda();
    console.log("Agenda has started");
  } catch (err) {
    console.log(err);
  }
})();

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/videos", videoRoutes);
app.use("/notification", notificationRoutes);

app.use(globalErrorHandler);

module.exports = app;
