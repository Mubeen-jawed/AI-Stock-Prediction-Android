const Portfolio = require("../models/Portfolio.js");
const { getLivePrice } = import("../services/stockService.js");

// Create new portfolio
const createPortfolio = async (req, res) => {
  try {
    const { stocks } = req.body; // stocks = [payload] from frontend

    if (!stocks || stocks.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one stock" });
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });

    // If no portfolio exists, create one
    if (!portfolio) {
      portfolio = new Portfolio({
        user: req.user._id,
        stocks: [],
      });
    }

    stocks.forEach((incoming) => {
      const existing = portfolio.stocks.find(
        (s) => s.symbol === incoming.symbol
      );

      if (existing) {
        // merge here
        existing.quantity += incoming.quantity;

        // optionally update other fields
        existing.buyPrice = incoming.buyPrice;
        existing.currentPrice = incoming.currentPrice;
        existing.logo = incoming.logo;
        existing.companyName = incoming.companyName;
      } else {
        portfolio.stocks.push(incoming);
      }
    });

    await portfolio.save();

    res
      .status(201)
      .json({ message: "Portfolio created or updated", portfolio });
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
