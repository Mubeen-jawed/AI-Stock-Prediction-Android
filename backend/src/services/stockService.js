const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const FINNHUB_BASE = "https://finnhub.io/api/v1";

const getLivePrice = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE}/quote`, {
      params: { symbol, token: process.env.FINNHUB_API_KEY },
    });

    const data = res.data;

    return {
      symbol,
      currentPrice: data.c, // current price
      open: data.o, // open price
      high: data.h,
      low: data.l,
      prevClose: data.pc,
      change: data.d,
      percentChange: data.dp,
    };
  } catch (err) {
    console.error("Error fetching price:", err.message);
    throw new Error("Unable to fetch live price");
  }
};

const getAllSharesList = async (exchange = "US") => {
  try {
    const res = await axios.get(`${FINNHUB_BASE}/stock/symbol`, {
      params: {
        exchange,
        token: process.env.FINNHUB_API_KEY,
      },
    });

    return res.data.map((stock) => ({
      symbol: stock.symbol,
      name: stock.description,
      type: stock.type,
    }));
  } catch (err) {
    console.error(
      "Error fetching stock list:",
      err.response?.data || err.message
    );
    throw new Error("Unable to fetch stock list");
  }
};

async function fetchStockData(ticker = "AAPL") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=60d`;

  const response = await axios.get(url);
  const result = response.data.chart.result[0];

  const timestamps = result.timestamp;
  const indicators = result.indicators.quote[0];

  // Build features array: [Open, High, Low, Close, Volume]
  const features = timestamps.map((_, i) => [
    indicators.open[i],
    indicators.high[i],
    indicators.low[i],
    indicators.close[i],
    indicators.volume[i],
  ]);

  return features;
}

const getCompanyProfile = async (symbol) => {
  try {
    const res = await axios.get(`${FINNHUB_BASE}/stock/profile2`, {
      params: {
        symbol,
        token: process.env.FINNHUB_API_KEY,
      },
    });

    const data = res.data;

    return {
      name: data.name,
      logo: data.logo,
      currency: data.currency,
      exchange: data.exchange,
      marketCap: data.marketCapitalization,
    };
  } catch (err) {
    console.error("Error fetching company profile:", err.message);
    throw new Error("Unable to fetch company profile");
  }
};

module.exports = {
  getLivePrice,
  getAllSharesList,
  fetchStockData,
  getCompanyProfile,
};
