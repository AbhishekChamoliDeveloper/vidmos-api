const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routers/authRoutes");
const globalErrorHandler = require("./middlewares/globalErrorHandler");

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

app.use("/auth", authRoutes);

app.use(globalErrorHandler);

module.exports = app;
