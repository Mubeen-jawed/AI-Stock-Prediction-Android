const Portfolio = require("../models/Portfolio.js");
const { getLivePrice } = import("../services/stockService.js");

// Create new portfolio
const createPortfolio = async (req, res) => {
  try {
    const { stocks } = req.body;

    if (!stocks || stocks.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one stock" });
    }

    // If portfolio exists → push new stocks
    // If not → create a new one (upsert)
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      { $push: { stocks: { $each: stocks } } },
      { new: true, upsert: true }
    );

    res
      .status(201)
      .json({ message: "Portfolio created/updated successfully", portfolio });
  } catch (error) {
    console.error("Create portfolio error:", error);
    res.status(500).json({ message: error.message });
  }
};
// Get all portfolios of a user
//  const getPortfolios = async (req, res) => {
//   try {
//     const portfolios = await Portfolio.find({ user: req.user._id });
//     res.status(200).json(portfolios);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Delete a portfolio
const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio)
      return res.status(404).json({ message: "Portfolio not found" });
    if (portfolio.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    await portfolio.deleteOne();
    res.status(200).json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPortfolioPerformance = async (req, res) => {
  try {
    // 1) Get portfolio from DB for this user
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio || !portfolio.stocks || portfolio.stocks.length === 0) {
      return res.json({ portfolio: [] });
    }

    const results = [];

    // 2) Loop over saved stocks in DB
    for (const stock of portfolio.stocks) {
      // const live = await getLivePrice(stock.symbol); // your helper

      const totalValue = stock.quantity * stock.currentPrice;
      const invested = stock.quantity * stock.buyPrice;
      const profitLoss = totalValue - invested;
      const percentChange = ((profitLoss / invested) * 100).toFixed(2);

      results.push({
        symbol: stock.symbol,
        companyName: stock.companyName,
        quantity: stock.quantity,
        buyPrice: stock.buyPrice,
        currentPrice: stock.currentPrice,
        totalValue: totalValue.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        percentChange,
      });
    }

    // 3) Send response
    res.json({ portfolio: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching portfolio data" });
  }
};

module.exports = { createPortfolio, deletePortfolio, getPortfolioPerformance };
