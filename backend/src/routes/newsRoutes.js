// routes/newsRoutes.js
const express = require("express");
const {
  getStockNewsList,
  getStockNewsDetail,
} = require("../controllers/newsController");

const router = express.Router();

// GET /api/stocks/news?symbol=PPL
router.get("/", getStockNewsList);

// GET /api/stocks/news/:id?symbol=PPL
router.get("/:id", getStockNewsDetail);

module.exports = router;
