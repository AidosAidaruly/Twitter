const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: "username, email, password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "password must be at least 6 chars" });
    }

    const exists = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
    if (exists) {
      return res.status(409).json({ ok: false, error: "username or email already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "register failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email, password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "login failed" });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ ok: false, error: "user not found" });
    return res.json({ ok: true, user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "me failed" });
  }
}

// ✅ PATCH /api/auth/me  (обновление профиля)
async function updateMe(req, res) {
  try {
    const { bio, avatarUrl } = req.body;

    const patch = {};
    if (bio !== undefined) patch.bio = String(bio);
    if (avatarUrl !== undefined) patch.avatarUrl = String(avatarUrl);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: patch },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ ok: false, error: "user not found" });

    return res.json({ ok: true, user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "update profile failed" });
  }
}

module.exports = { register, login, me, updateMe };
