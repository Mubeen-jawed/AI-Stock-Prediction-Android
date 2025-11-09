const express = require("express");
const {
  getStockPrice,
  getStocksList,
} = require("../controllers/stockController.js");

const router = express.Router();

router.get("/price/:symbol", getStockPrice);
router.get("/", getStocksList);

module.exports = router;
