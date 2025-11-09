const express = require("express");
const { protect } = require("../middleware/authMiddleware.js");
const {
  createPortfolio,
  getPortfolioPerformance,
  deletePortfolio,
} = require("../controllers/portfolioController.js");

const router = express.Router();

router.post("/", protect, createPortfolio);
// router.get("/", protect, getPortfolios);
router.delete("/:id", protect, deletePortfolio);
router.get("/", getPortfolioPerformance);

module.exports = router;
