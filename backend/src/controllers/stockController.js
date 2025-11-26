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
  const { exchange = "US" } = req.query;

  try {
    const now = Date.now();

    // 1. Serve cached data if fresh
    if (cachedStocks && now - lastFetchTime < CACHE_TTL) {
      return res.json(cachedStocks);
    }

    // 2. Fetch stock symbols list from Finnhub
    const stocks = await getAllSharesList(exchange);

    // Limit to avoid rate limits (tune 20 → 30 depending on your plan)
    const limited = stocks.slice(0, 20);

    // 3. Fetch profile + live price for all in parallel
    const results = await Promise.allSettled(
      limited.map(async (stock) => {
        const { symbol, name } = stock;

        const [profile, quote] = await Promise.all([
          getCompanyProfile(symbol),
          getLivePrice(symbol),
        ]);

        return {
          symbol,
          name: profile?.name || name,
          logo: profile?.logo || null,
          price: quote?.currentPrice ?? null,
          changePercent: quote?.percentChange ?? null,
        };
      })
    );

    // 4. Collect successful results
    const finalList = [];
    results.forEach((r, idx) => {
      if (r.status === "fulfilled" && r.value) {
        finalList.push(r.value);
      } else if (r.status === "rejected") {
        const { symbol } = limited[idx];
        console.log(
          `Error fetching for ${symbol}:`,
          r.reason?.message || r.reason
        );
      }
    });

    const response = {
      count: finalList.length,
      data: finalList,
    };

    // 5. Save to cache
    cachedStocks = response;
    lastFetchTime = now;

    return res.json(response);
  } catch (err) {
    console.error("Error in getStocksList:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getStockPrice, getStocksList };
