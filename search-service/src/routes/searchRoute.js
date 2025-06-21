const express = require("express");
const {
  searchPostController,
  getAllSearchPosts,
} = require("../controllers/searchController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateRequest);
router.get("/posts", searchPostController);
router.get("/posts/get", getAllSearchPosts);

module.exports = router;
