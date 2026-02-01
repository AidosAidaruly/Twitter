const mongoose = require("mongoose");
const Like = require("../models/Like");
const Post = require("../models/Post");

// POST /api/posts/:id/like
async function likePost(req, res) {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ ok: false, error: "invalid post id" });
    }

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ ok: false, error: "post not found" });
    }

    // пытаемся создать like (unique index защитит от дубля)
    try {
      await Like.create({ userId: req.user.id, postId });

      // advanced op: $inc
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: 1 } });

      return res.status(201).json({ ok: true, liked: true });
    } catch (e) {
      // если уже лайкнул — вернём liked:true, но без увеличения счётчика
      if (e.code === 11000) {
        return res.json({ ok: true, liked: true, message: "already liked" });
      }
      throw e;
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: "like failed" });
  }
}

// DELETE /api/posts/:id/like
async function unlikePost(req, res) {
  try {
    const postId = req.params.id;
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ ok: false, error: "invalid post id" });
    }

    const del = await Like.deleteOne({ userId: req.user.id, postId });

    if (del.deletedCount === 1) {
      // advanced op: $inc (уменьшаем только если реально удалили)
      await Post.updateOne({ _id: postId }, { $inc: { likesCount: -1 } });
    }

    return res.json({ ok: true, liked: false });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "unlike failed" });
  }
}

module.exports = { likePost, unlikePost };
