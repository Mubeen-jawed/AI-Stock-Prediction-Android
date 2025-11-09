const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route example
router.get("/profile", protect, (req, res) => {
  res.json({ message: "Access granted 🚀", user: req.user });
});

module.exports = router;
