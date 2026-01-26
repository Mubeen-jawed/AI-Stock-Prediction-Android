const mongoose = require("mongoose");
const Portfolio = require("../models/Portfolio.js");
const { getLivePrice, fetchPSXData, fetchSingleStock } = require("../services/stockService.js");
const { predictPrice } = require("../services/predictionService.js");

// Create new portfolio
const createPortfolio = async (req, res) => {
  try {
    const { stocks } = req.body; // stocks = [payload] from frontend

    if (!stocks || stocks.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one stock" });
    }

    // Use static ID for now as requested
    const userId = req.user?._id || new mongoose.Types.ObjectId("68f7af8fec413749bb1f58e8");

    let portfolio = await Portfolio.findOne({ user: userId });

    // If no portfolio exists, create one
    if (!portfolio) {
      portfolio = new Portfolio({
        user: userId,
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
//     const portfolios = await Portfolio.find({ user: req.user?._id });
//     res.status(200).json(portfolios);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Delete a portfolio
// DELETE /api/portfolio/stocks/:symbol
const deletePortfolio = async (req, res) => {
  try {
    const { symbol } = req.params;

    const userId = req.user?._id || new mongoose.Types.ObjectId("68f7af8fec413749bb1f58e8");
    const portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const before = portfolio.stocks.length;

    portfolio.stocks = portfolio.stocks.filter(
      (s) => (s.symbol || "").toUpperCase() !== String(symbol).toUpperCase()
    );

    if (portfolio.stocks.length === before) {
      return res.status(404).json({ message: "Stock not found in portfolio" });
    }

    await portfolio.save();

    return res.status(200).json({
      message: "Stock deleted successfully",
      portfolio,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPortfolioPerformance = async (req, res) => {
  try {
    // Static ID for now as requested
    const userId = req.user?._id ||  new mongoose.Types.ObjectId("68f7af8fec413749bb1f58e8");
    const portfolio = await Portfolio.findOne({ user: userId });

    if (!portfolio || !portfolio.stocks || portfolio.stocks.length === 0) {
      return res.json({ 
        summary: {
          totalInvested: 0,
          totalValue: 0,
          totalGainLoss: 0,
          overallChangePct: 0
        },
        portfolio: [] 
      });
    }

    // 1. Fetch live PSX prices for matching
    let liveData = [];
    try {
      liveData = await fetchPSXData();
    } catch (e) {
      console.warn("Could not fetch live PSX data for portfolio, using saved prices:", e.message);
    }

    const results = [];
    let totalInvested = 0;
    let totalValue = 0;

    // 2. Loop over saved stocks and calculate metrics
    for (const stock of portfolio.stocks) {
      let liveInfo = liveData.find(ld => ld.symbol === stock.symbol.toUpperCase());
      
      if (!liveInfo) {
        try {
          const single = await fetchSingleStock(stock.symbol);
          if (single) {
            liveInfo = {
              price: single.price,
              changeAbsolute: single.changeAbsolute,
              changePercent: single.changePercent,
              lastUpdated: single.lastUpdated
            };
          }
        } catch (e) {
          console.warn(`Could not fetch fallback price for ${stock.symbol}:`, e.message);
        }
      }

      const currentPrice = liveInfo ? (liveInfo.price || liveInfo.currentPrice) : (stock.currentPrice || stock.buyPrice || 0);
      
      const investedAmount = stock.quantity * stock.buyPrice;
      const marketValue = stock.quantity * currentPrice;
      const profitLoss = marketValue - investedAmount;
      const percentChange = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

      totalInvested += investedAmount;
      totalValue += marketValue;

      results.push({
        logo: stock.logo,
        symbol: stock.symbol,
        companyName: stock.companyName,
        quantity: stock.quantity,
        buyPrice: stock.buyPrice,
        currentPrice: currentPrice,
        investedAmount: parseFloat(investedAmount.toFixed(2)),
        marketValue: parseFloat(marketValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        percentChange: parseFloat(percentChange.toFixed(2)),
        changeAbsolute: liveInfo ? liveInfo.changeAbsolute : 0,
        changePercent: liveInfo ? liveInfo.changePercent : 0,
        lastUpdated: liveInfo ? liveInfo.lastUpdated : null
      });
    }

    const totalGainLoss = totalValue - totalInvested;
    const overallChangePct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // 3. Send detailed response
    res.json({
      summary: {
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
        overallChangePct: parseFloat(overallChangePct.toFixed(2))
      },
      portfolio: results
    });
  } catch (err) {
    console.error("Portfolio performance error:", err);
    res.status(500).json({ message: "Error fetching portfolio data" });
  }
};

const updateHoldings = async (req, res) => {
  try {
    // Use static ID for now as requested
    const userId = req.user?._id || new mongoose.Types.ObjectId("68f7af8fec413749bb1f58e8");
    const { payload } = req.body; // [{ symbol, quantity, buyPrice }]

    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ message: "payload array is required" });
    }

    // sanitize
    const clean = payload
      .filter((s) => typeof s.symbol === "string" && s.symbol.trim())
      .map((s) => ({
        symbol: s.symbol.trim().toUpperCase(),
        quantity: Number(s.quantity) || 0,
        buyPrice: Number(s.buyPrice) || 0,
      }));

    // Build $set + arrayFilters for each symbol
    const setObj = {};
    const arrayFilters = [];

    clean.forEach((s, i) => {
      setObj[`stocks.$[s${i}].quantity`] = s.quantity;
      setObj[`stocks.$[s${i}].buyPrice`] = s.buyPrice;
      arrayFilters.push({ [`s${i}.symbol`]: s.symbol });
    });

    const updated = await Portfolio.findOneAndUpdate(
      { user: userId },
      { $set: setObj },
      { new: true, arrayFilters }
    );

    if (!updated)
      return res.status(404).json({ message: "Portfolio not found" });

    return res.json({ message: "Updated", portfolio: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
  }


const getPortfolioPrediction = async (req, res) => {
  try {
    const { days = 7, modelType = "lstm"} = req.query;
    
    // Use static ID for now as requested
    const id = req.user?._id || new mongoose.Types.ObjectId("68f7af8fec413749bb1f58e8");
    // const id = req.user?._id;

    if (!id) {
        return res.status(400).json({ message: "User ID required (auth disabled)" });
    }

    const portfolio = await Portfolio.findOne({ user: id });

    if (!portfolio || !portfolio.stocks || portfolio.stocks.length === 0) {
      return res.json({
        currentTotal: 0,
        predictedTotal: 0,
        portfolio: [],
      });
    }

    // 1. Fetch live PSX prices for current reference
    let liveData = [];
    try {
      liveData = await fetchPSXData();
    } catch (e) {
      console.warn("Could not fetch live PSX data for prediction:", e.message);
    }

    let currentTotal = 0;
    let predictedTotal = 0;
    const results = [];

    // 2. Process each stock
    await Promise.all(
      portfolio.stocks.map(async (stock) => {
        try {
          // Find live price
          let liveInfo = liveData.find(ld => ld.symbol === stock.symbol.toUpperCase());
          if (!liveInfo) {
            try {
              const single = await fetchSingleStock(stock.symbol);
              if (single) liveInfo = single;
            } catch (err) { /* ignore */ }
          }
          
          const currentPrice = liveInfo ? (liveInfo.price || liveInfo.currentPrice) : (stock.currentPrice || stock.buyPrice || 0);

          const prediction = await predictPrice(
            stock.symbol,
            Number(days),
            modelType
          );
          
          const lastPred = prediction.predictions[prediction.predictions.length - 1];
          const predictedPrice = lastPred ? lastPred.price : currentPrice;

          const stockValue = stock.quantity * currentPrice;
          const predictedStockValue = stock.quantity * predictedPrice;

          currentTotal += stockValue;
          predictedTotal += predictedStockValue;

          results.push({
            symbol: stock.symbol,
            quantity: stock.quantity,
            currentPrice: currentPrice,
            predictedPrice: predictedPrice,
            currentValue: parseFloat(stockValue.toFixed(2)),
            predictedValue: parseFloat(predictedStockValue.toFixed(2)),
            predictionData: prediction.predictions,
          });
        } catch (error) {
          console.error(`Prediction failed for ${stock.symbol}:`, error.message);
          
          let liveInfo = liveData.find(ld => ld.symbol === stock.symbol.toUpperCase());
          const currentPrice = liveInfo ? (liveInfo.price || liveInfo.currentPrice) : (stock.currentPrice || stock.buyPrice || 0);
          
          const stockValue = stock.quantity * currentPrice;
          currentTotal += stockValue;
          predictedTotal += stockValue;

          results.push({
            symbol: stock.symbol,
            quantity: stock.quantity,
            currentPrice: currentPrice,
            predictedPrice: currentPrice,
            currentValue: parseFloat(stockValue.toFixed(2)),
            predictedValue: parseFloat(stockValue.toFixed(2)),
            error: "Prediction unavailable",
          });
        }
      })
    );

    res.json({
      currentTotal: parseFloat(currentTotal.toFixed(2)),
      predictedTotal: parseFloat(predictedTotal.toFixed(2)),
      portfolio: results,
    });
  } catch (err) {
    console.error("Portfolio prediction error:", err);
    res.status(500).json({ message: "Error calculating portfolio prediction" });
  }
};

module.exports = {
  createPortfolio,
  deletePortfolio,
  getPortfolioPerformance,
  updateHoldings,
  getPortfolioPrediction,
};
