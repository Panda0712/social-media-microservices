const logger = require("../utils/logger");
const User = require("../models/User");
const { validateRegistration, validateLogin } = require("../utils/validation");
const { generateTokens } = require("../utils/generateTokens");
const RefreshToken = require("../models/RefreshToken");

// user registration
const registerUser = async (req, res, next) => {
  logger.info("Registration endpoint hit...");
  try {
    // validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation failed: ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;
    const checkUser = await User.findOne({ $or: [{ email }, { username }] });
    if (checkUser) {
      logger.warn("User already existed!");
      return res.status(400).json({
        success: false,
        message: "User already existed!",
      });
    }

    const newUser = await User.create({ email, password, username });
    logger.warn("New user created successfully", newUser._id);

    const { accessToken, refreshToken } = await generateTokens(newUser);

    res.status(201).json({
      success: true,
      message: "New user created successfully!",
      data: newUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error happened: ", error);
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

// user login
const loginUser = async (req, res, next) => {
  logger.info("Login endpoint hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation failed: ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      logger.warn("Invalid user!");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    const isMatchedPassword = await checkUser.comparePassword(password);
    if (!isMatchedPassword) {
      logger.warn("Invalid password!");
      return res.status(400).json({
        success: false,
        message: "Invalid password!",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(checkUser);
    res.status(200).json({
      accessToken,
      refreshToken,
      userId: checkUser._id,
    });
  } catch (error) {
    logger.error("Login error happened: ", error);
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

// refresh token
const refreshTokenController = async (req, res, next) => {
  logger.info("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing!");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiredAt < new Date()) {
      logger.warn("Invalid or expired refresh token!");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token!",
      });
    }

    const user = await User.findById({ _id: storedToken.user });
    if (!user) {
      logger.warn("User not found!");
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    // delete old token
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error happened: ", error);
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

// logout
const logoutUser = async (req, res, next) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing!");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted successfully!");

    res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    logger.error("Logout error happened: ", error);
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenController,
  logoutUser,
};
