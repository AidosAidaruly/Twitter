const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { deleteComment } = require("../controllers/comments.controller");

router.delete("/:id", requireAuth, deleteComment);

module.exports = router;
