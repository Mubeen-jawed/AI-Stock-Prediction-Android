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

const TD_BASE = process.env.TWELVE_DATA_BASE || "https://api.twelvedata.com";
const TD_KEY = process.env.TWELVE_DATA_API_KEY;

// Map your app filters -> interval + number of candles (outputsize)
// You can tweak these to match your UI density
const RANGE_PRESETS = {
  "1D": { interval: "15min", outputsize: 96 }, // 24h / 15m = 96
  "5D": { interval: "1h", outputsize: 120 }, // 5d * 24 = 120
  "1M": { interval: "4h", outputsize: 180 }, // enough detail, not dense
  "6M": { interval: "1day", outputsize: 140 },
  "1Y": { interval: "1day", outputsize: 220 },
};

function normalizeTwelveDataError(data) {
  // Twelve Data often returns { status: "error", message, code }
  if (data && data.status === "error") {
    const msg = data.message || "Twelve Data error";
    const code = data.code || "TD_ERROR";
    return new Error(`${msg} (${code})`);
  }
  return null;
}

const getCandlesTwelveData = async (symbol, range = "1M") => {
  if (!TD_KEY) throw new Error("TWELVE_DATA_API_KEY is missing");

  const preset = RANGE_PRESETS[range] || RANGE_PRESETS["1M"];
  const interval = preset.interval;
  const outputsize = preset.outputsize;

  try {
    const res = await axios.get(`${TD_BASE}/time_series`, {
      params: {
        symbol,
        interval,
        outputsize,
        apikey: TD_KEY,
        format: "JSON",
        // Optional but recommended:
        // timezone: "UTC",
        // order: "ASC"  // if supported; we'll sort anyway
      },
      timeout: 15000,
    });

    const tdErr = normalizeTwelveDataError(res.data);
    if (tdErr) throw tdErr;

    const values = res.data?.values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("No candle data returned");
    }

    // Twelve Data returns values in descending time order (commonly).
    // We'll normalize to ascending for charting.
    const candles = values
      .map((v) => ({
        timestamp: v.datetime, // string like "2025-12-24 10:00:00"
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: v.volume != null ? Number(v.volume) : null,
      }))
      .filter(
        (c) =>
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      symbol,
      range,
      interval,
      candles,
    };
  } catch (err) {
    // axios network error
    const msg =
      err?.response?.data?.message || err.message || "Unable to fetch candles";
    throw new Error(msg);
  }
};

module.exports = {
  getLivePrice,
  getAllSharesList,
  fetchStockData,
  getCompanyProfile,
  getCandlesTwelveData,
};
