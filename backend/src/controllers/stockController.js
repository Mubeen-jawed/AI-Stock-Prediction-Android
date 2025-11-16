const {
  getAllSharesList,
  getLivePrice,
  getCompanyProfile,
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

let cachedStocks = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute caching

const getStocksList = async (req, res) => {
  const { exchange } = req.query;

  try {
    const now = Date.now();

    // 1. Serve cached data if fresh
    if (cachedStocks && now - lastFetchTime < CACHE_TTL) {
      return res.json(cachedStocks);
    }

    // 2. Fetch stock symbols list
    const stocks = await getAllSharesList(exchange || "US");

    // Limit to avoid rate limits (20–30 is safest)
    const limited = stocks.slice(0, 20);

    const finalList = [];

    // 3. Fetch live price + profile, but in batches
    for (const stock of limited) {
      const { symbol, name } = stock;

      try {
        const [profile, quote] = await Promise.all([
          getCompanyProfile(symbol),
          getLivePrice(symbol),
        ]);

        finalList.push({
          symbol,
          name: profile?.name || name,
          logo: profile?.logo || null,
          currency: profile?.currency || "USD",
          price: quote?.currentPrice || null,
          changePercent: quote?.percentChange || null,
        });
      } catch (innerErr) {
        console.log(`Error fetching for ${symbol}:`, innerErr.message);
      }
    }

    const response = {
      count: finalList.length,
      data: finalList,
    };

    // Save to cache
    cachedStocks = response;
    lastFetchTime = now;

    res.json(response);
  } catch (err) {
    console.error("Error in getStocksList:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStockPrice, getStocksList };
