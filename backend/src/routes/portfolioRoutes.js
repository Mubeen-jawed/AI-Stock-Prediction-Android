const express = require("express");
const { protect } = require("../middleware/authMiddleware.js");
const {
  createPortfolio,
  getPortfolioPerformance,
  updateHoldings,
  deletePortfolio,
} = require("../controllers/portfolioController.js");

const router = express.Router();

router.get("/", protect, getPortfolioPerformance);
router.post("/", protect, createPortfolio);
router.delete("/:symbol", protect, deletePortfolio);
router.put("/update-holdings", protect, updateHoldings);

module.exports = router;
