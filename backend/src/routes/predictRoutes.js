const express = require("express");
const {
  predictPriceController,
} = require("../controllers/predictionController");

const router = express.Router();

router.post("/:ticker", predictPriceController);

module.exports = router;
