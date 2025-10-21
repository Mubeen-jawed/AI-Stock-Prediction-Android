import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPortfolio,
  getPortfolioPerformance,
  deletePortfolio,
} from "../controllers/portfolioController.js";

const router = express.Router();

router.post("/", protect, createPortfolio);
// router.get("/", protect, getPortfolios);
router.delete("/:id", protect, deletePortfolio);
router.get("/", getPortfolioPerformance);

export default router;
