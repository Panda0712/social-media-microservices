const Post = require("../models/Post");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { validatePost } = require("../utils/validation");

const invalidatePostCache = async (req, input) => {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
};

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit...");
  try {
    // validate the schema
    const { error } = validatePost(req.body);
    if (error) {
      logger.warn("Validation failed: ", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newPost = await Post.create({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    // publish post created event method
    await publishEvent("post.created", {
      postId: newPost._id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePostCache(req, newPost._id.toString());
    logger.info("New post created successfully!", newPost);
    res.status(201).json({
      success: true,
      message: "New post created successfully!",
      data: newPost,
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachePosts = await req.redisClient.get(cacheKey);

    if (cachePosts) {
      return res.status(200).json(JSON.parse(cachePosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };

    // save your post in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const cacheKey = `post:${postId}`;
    const cachePost = await req.redisClient.get(cacheKey);

    if (cachePost) {
      return res.status(200).json(JSON.parse(cachePost));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found!",
      });
    }

    const result = {
      success: true,
      data: post,
    };

    // save new post to redis
    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    logger.error("Error fetching post by ID", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by ID",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found!",
      });
    }

    const deletedPost = await Post.findByIdAndDelete({
      _id: postId,
      user: req.user.userId,
    });
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found!",
      });
    }

    // publish post delete method
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, postId);

    res.status(200).json({
      success: true,
      message: "Delete post successfully!",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};
