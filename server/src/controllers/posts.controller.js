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

// GET /api/posts/mine?page=1&limit=10
async function listMyPosts(req, res) {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const filter = {
      authorId: req.user.id,
      isDeleted: false
      // статус НЕ ограничиваем — вернем и draft, и published
    };

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("authorId", "username")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter)
    ]);

    return res.json({ ok: true, page: pageNum, limit: limitNum, total, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "list my posts failed" });
  }
}

// GET /api/posts/drafts?page=1&limit=10
async function listMyDrafts(req, res) {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const filter = {
      authorId: req.user.id,
      status: "draft",
      isDeleted: false
    };

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("authorId", "username")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter)
    ]);

    return res.json({ ok: true, page: pageNum, limit: limitNum, total, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "list my drafts failed" });
  }
}

// ✅ GET /api/posts/trending?days=7&limit=20&tag=&search=
async function listTrendingPosts(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || "7", 10), 1), 365);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);

    const tag = req.query.tag ? String(req.query.tag).toLowerCase() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const match = {
      status: "published",
      isDeleted: false,
      createdAt: { $gte: since }
    };

    if (tag) match.tags = tag;

    if (search) {
      match.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }

    const items = await Post.aggregate([
      { $match: match },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ["$likesCount", 0] }, 2] },
              { $multiply: [{ $ifNull: ["$commentsCount", 0] }, 3] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          authorId: {
            _id: "$author._id",
            username: "$author.username"
          }
        }
      },
      { $project: { author: 0, score: 0 } }
    ]);

    return res.json({ ok: true, days, limit, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "trending failed" });
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

    const updated = await Post.findByIdAndUpdate(id, { $set: patch }, { new: true });
    return res.json({ ok: true, post: updated });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "update post failed" });
  }
}

// DELETE /api/posts/:id (soft delete)
async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post || post.isDeleted) return res.status(404).json({ ok: false, error: "post not found" });

    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "only author can delete" });
    }

    await Post.updateOne({ _id: id }, { $set: { isDeleted: true } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "delete post failed" });
  }
}

module.exports = {
  createPost,
  listPosts,
  listMyPosts,
  listMyDrafts,
  listTrendingPosts, // ✅ NEW
  getPost,
  updatePost,
  deletePost
};
