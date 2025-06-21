const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectToTheDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected successfully!");
    console.log("MongoDB connected successfully!");
  } catch (error) {
    logger.error("Mongo connection error: ", error);
    console.log(error);
    process.exit(1);
  }
};

module.exports = {
  connectToTheDatabase,
};
