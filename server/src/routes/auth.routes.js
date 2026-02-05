const router = require("express").Router();
const { register, login, me, updateMe } = require("../controllers/auth.controller"); // ✅ updateMe
const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe); // ✅ NEW: обновление профиля

module.exports = router;
