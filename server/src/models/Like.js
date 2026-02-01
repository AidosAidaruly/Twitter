const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true }
  },
  { timestamps: true }
);

// нельзя лайкнуть один пост дважды одним юзером
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
