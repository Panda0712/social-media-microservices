const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

// middleware
router.use(authenticateRequest);

router.post("/", createPost);
router.delete("/:postId", deletePost);
router.get("/:postId", getPost);
router.get("/", getAllPosts);

module.exports = router;
