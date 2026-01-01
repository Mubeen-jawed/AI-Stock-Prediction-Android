const express = require("express");
const {
  getStockPrice,
  getStocksList,
  getStockCandles,
} = require("../controllers/stockController.js");

const router = express.Router();

router.get("/chart/:symbol", getStockCandles);

router.get("/price/:symbol", getStockPrice);
router.get("/", getStocksList);

module.exports = router;
