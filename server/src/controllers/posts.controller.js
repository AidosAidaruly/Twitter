const mongoose = require("mongoose");
const Post = require("../models/Post");

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
  return String(tags)
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

// POST /api/posts
async function createPost(req, res) {
  try {
    const { title, content, tags, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ ok: false, error: "title and content required" });
    }

    const post = await Post.create({
      authorId: req.user.id,
      title,
      content,
      tags: parseTags(tags),
      status: status === "draft" ? "draft" : "published"
    });

    return res.status(201).json({ ok: true, post });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "create post failed" });
  }
}

// GET /api/posts?search=&tag=&authorId=&sort=latest|top&page=1&limit=10
async function listPosts(req, res) {
  try {
    const { search, tag, authorId, sort = "latest", page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const filter = { status: "published", isDeleted: false };

    if (authorId && mongoose.isValidObjectId(authorId)) filter.authorId = authorId;
    if (tag) filter.tags = String(tag).toLowerCase();

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { title: { $regex: s, $options: "i" } },
        { content: { $regex: s, $options: "i" } }
      ];
    }

    const sortObj =
      sort === "top"
        ? { likesCount: -1, commentsCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("authorId", "username")
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter)
    ]);

    return res.json({ ok: true, page: pageNum, limit: limitNum, total, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "list posts failed" });
  }
}

// GET /api/posts/:id
async function getPost(req, res) {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post || post.isDeleted) return res.status(404).json({ ok: false, error: "post not found" });

    // draft только автору
    if (post.status === "draft" && post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    return res.json({ ok: true, post });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "get post failed" });
  }
}

// PATCH /api/posts/:id
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, content, tags, status } = req.body;

    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ ok: false, error: "post not found" });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "only author can edit" });
    }

    const patch = {};
    if (title !== undefined) patch.title = title;
    if (content !== undefined) patch.content = content;
    if (tags !== undefined) patch.tags = parseTags(tags);
    if (status !== undefined) patch.status = status === "draft" ? "draft" : "published";

    // Advanced op: $set
    const updated = await Post.findByIdAndUpdate(id, { $set: patch }, { new: true });

    return res.json({ ok: true, post: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "update post failed" });
  }
}

// DELETE /api/posts/:id  (soft delete)
async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ ok: false, error: "post not found" });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "only author can delete" });
    }

    // Advanced op: $set (soft delete)
    await Post.updateOne({ _id: id }, { $set: { isDeleted: true } });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "delete post failed" });
  }
}

module.exports = { createPost, listPosts, getPost, updatePost, deletePost };
