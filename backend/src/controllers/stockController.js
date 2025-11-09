const {
  getAllSharesList,
  getLivePrice,
} = require("../services/stockService.js");

const getStockPrice = async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ message: "Stock symbol is required" });
  }

  try {
    const priceData = await getLivePrice(symbol.toUpperCase());
    res.json(priceData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStocksList = async (req, res) => {
  const { exchange } = req.query;
  try {
    const list = await getAllSharesList(exchange || "US");
    console.log(list, "list");
    res.json({ count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStockPrice, getStocksList };
