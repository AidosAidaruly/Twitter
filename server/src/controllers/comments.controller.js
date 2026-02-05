const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

// POST /api/posts/:id/comments
async function addComment(req, res) {
  try {
    const postId = req.params.id;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ ok: false, error: "invalid post id" });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ ok: false, error: "text required" });
    }

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ ok: false, error: "post not found" });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      text: String(text).trim(),
    });

    // advanced op: $inc
    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

    return res.status(201).json({ ok: true, comment });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "add comment failed" });
  }
}

// GET /api/posts/:id/comments?page=1&limit=10
async function listComments(req, res) {
  try {
    const postId = req.params.id;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ ok: false, error: "invalid post id" });
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);

    const [items, total] = await Promise.all([
      Comment.find({ postId, isDeleted: false })
        .populate("userId", "username") // ✅ ВОТ ОНО: чтобы вместо id был username
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments({ postId, isDeleted: false }),
    ]);

    return res.json({ ok: true, page, limit, total, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "list comments failed" });
  }
}

// DELETE /api/comments/:id  (soft delete, only author)
async function deleteComment(req, res) {
  try {
    const commentId = req.params.id;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ ok: false, error: "invalid comment id" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ ok: false, error: "comment not found" });
    }

    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "only author can delete" });
    }

    await Comment.updateOne({ _id: commentId }, { $set: { isDeleted: true } });

    // advanced op: $inc (уменьшаем счётчик)
    await Post.updateOne({ _id: comment.postId }, { $inc: { commentsCount: -1 } });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "delete comment failed" });
  }
}

module.exports = { addComment, listComments, deleteComment };
