const express = require("express");
const {
  getStockPrice,
  getStocksList,
  getStockCandles,
  getPSXStocks,
  getSinglePSXStock,
  getPSXStockHistory,
} = require("../controllers/stockController.js");

const router = express.Router();

// US Stock Routes
router.get("/", getStocksList);
router.get("/price/:symbol", getStockPrice);
router.get("/chart/:symbol", getStockCandles);

//PSX Routes
router.get("/psx", getPSXStocks);
router.get("/psx/:symbol", getSinglePSXStock);
router.get("/psx/:symbol/history", getPSXStockHistory);

module.exports = router;
