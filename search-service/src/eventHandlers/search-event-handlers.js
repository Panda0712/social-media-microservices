const logger = require("../utils/logger");
const Search = require("../models/Search");

const handlePostCreated = async (event) => {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    await newSearchPost.save();
    logger.info(
      `Completely added new post to search service, postId: ${
        event.postId
      }, searchPostId: ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error("Error handling post creation event", error);
  }
};

const handlePostDeleted = async (event) => {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(
      `Completely deleted post in search collection, post id: ${event.postId}`
    );
  } catch (error) {
    logger.error("Error handling post deletion event", error);
  }
};

module.exports = {
  handlePostCreated,
  handlePostDeleted,
};
