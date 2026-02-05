const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 5000 },

    tags: [{ type: String, trim: true, lowercase: true }],

    status: { type: String, enum: ["published", "draft"], default: "published", index: true },

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// индексы для ленты/поиска
postSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
