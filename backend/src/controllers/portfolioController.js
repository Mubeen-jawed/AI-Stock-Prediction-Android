const { Portfolio } = import("../models/Portfolio.js");
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

    const portfolio = await Portfolio.create({
      user: req.user._id,
      stocks,
    });

    res
      .status(201)
      .json({ message: "Portfolio created successfully", portfolio });
  } catch (error) {
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
    const portfolio = [
      { symbol: "AAPL", shares: 10, avgBuyPrice: 150 },
      { symbol: "MSFT", shares: 5, avgBuyPrice: 300 },
      { symbol: "TSLA", shares: 2, avgBuyPrice: 700 },
    ];

    const results = [];

    for (const stock of portfolio) {
      const live = await getLivePrice(stock.symbol);

      const totalValue = stock.shares * live.currentPrice;
      const invested = stock.shares * stock.avgBuyPrice;
      const profitLoss = totalValue - invested;
      const percentChange = ((profitLoss / invested) * 100).toFixed(2);

      results.push({
        ...stock,
        currentPrice: live.currentPrice,
        totalValue: totalValue.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        percentChange,
      });
    }

    res.json({ portfolio: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching portfolio data" });
  }
};
module.exports = { createPortfolio, deletePortfolio, getPortfolioPerformance };
