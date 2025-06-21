require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoute = require("./routes/mediaRoute");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToTheDatabase } = require("./config/db");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3003;

// connect to database
connectToTheDatabase();

// middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

// Homework - implement Ip based rate limiting for sensitive endpoints

// routes
app.use("/api/media", mediaRoute);

// error handler
app.use(errorHandler);

// connect to RabbitMQ and start the server
const startServer = async () => {
  try {
    await connectRabbitMQ();

    // consume all the events
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Media service is running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
};
startServer();

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
