const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPostController = async (req, res, next) => {
  logger.info("Search post endpoint hit!");
  try {
    const { query } = req.query;

    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Error searching post!", error);
    res.status(500).json({
      success: false,
      message: "Error searching post!",
    });
  }
};

const getAllSearchPosts = async (req, res) => {
  try {
    const posts = await Search.find({});
    logger.info("Fetching posts successfully!");
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

module.exports = {
  searchPostController,
  getAllSearchPosts,
};
