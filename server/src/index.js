const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const commentsRoutes = require("./routes/comments.routes");
require("dotenv").config();

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const postsRoutes = require("./routes/posts.routes");

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api/comments", commentsRoutes);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ ok: true, name: "MiniSocial API" });
});

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const st = mongoose.connection.readyState;
  res.json({
    ok: true,
    dbState:
      st === 1 ? "connected" : st === 2 ? "connecting" : st === 3 ? "disconnecting" : "disconnected",
    dbName: mongoose.connection?.name || null
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB(process.env.MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`✅ API running: http://localhost:${PORT}`);
  });
})();
