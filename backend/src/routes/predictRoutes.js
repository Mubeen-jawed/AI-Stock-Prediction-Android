const express = require("express");
const {
  predictPriceController,
} = require("../controllers/predictionController");

const router = express.Router();

router.post("/", predictPriceController);

module.exports = router;
