require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const searchRoute = require("./routes/searchRoute");
const { connectToTheDatabase } = require("./config/db");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");

// initial app
const app = express();
const PORT = process.env.PORT || 3004;

// connect to the database
connectToTheDatabase();

const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

// Homework - implement Ip based rate limiting for sensitive endpoints

// Homework - pass redis client as part of your req and then implement redis caching

// route
app.use("/api/search", searchRoute);

// error handler
app.use(errorHandler);

// connect to RabbitMQ and start the server
const startServer = async () => {
  try {
    await connectRabbitMQ();

    // consume all the events
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`);
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
