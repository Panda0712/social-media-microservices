require("dotenv").config();
const express = require("express");
const { connectToTheDatabase } = require("./config/db");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoute = require("./routes/postRoute");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

// connect to the database
connectToTheDatabase();

// create new redis client
const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// log ìnfo middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  // always remember to call next function at the end of middleware
  next();
});

// *** homework - implement ip based rate limiting for sensitive endpoints

// routes -> pass redis client to routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoute
);

// error handler
app.use(errorHandler);

// connect to RabbitMQ and start the server
const startServer = async () => {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service is running on port: ${PORT}`);
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
