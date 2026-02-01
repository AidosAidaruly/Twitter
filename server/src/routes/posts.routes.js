const router = require("express").Router();
const { addComment, listComments } = require("../controllers/comments.controller");
const { likePost, unlikePost } = require("../controllers/likes.controller");
const { requireAuth } = require("../middleware/auth");
const {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost
} = require("../controllers/posts.controller");

router.get("/", listPosts);            // публичная лента
router.get("/:id", requireAuth, getPost); // просмотр draft ограничим авторизацией

router.post("/", requireAuth, createPost);
router.patch("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);
router.post("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);
router.post("/:id/comments", requireAuth, addComment);
router.get("/:id/comments", listComments);

module.exports = router;
