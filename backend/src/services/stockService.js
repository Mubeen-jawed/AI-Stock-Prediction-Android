const axios = require("axios");
const dotenv = require("dotenv");
const cheerio = require("cheerio");

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

async function fetchStockData(ticker = "PPL") {
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
    const msg =
      err?.response?.data?.message || err.message || "Unable to fetch candles";
    throw new Error(msg);
  }
};
const fetchPSXData = async () => {
  const url = "https://scanner.tradingview.com/pakistan/scan";

  const body = {
    filter: [],
    options: { lang: "en" },
    markets: ["pakistan"],
    symbols: {
      query: { types: [] },
      tickers: [],
    },
    columns: [
      "name",
      "close",
      "change",
      "change_abs",
      "open",
      "high",
      "low",
      "volume",
      "volume_change",
      "time",
    ],
    sort: {
      sortBy: "name",
      sortOrder: "asc",
    },
    range: [0, 500],
  };

  const res = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
      Origin: "https://www.tradingview.com",
      Referer: "https://www.tradingview.com/",
    },
  });

  const json = res.data;
  // Format current time in Pakistan Standard Time (UTC+5)
  const pktTime =
    new Date(new Date().getTime() + 5 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "") + "+05:00";

  return json.data.map((item) => {
    const price = item.d[1];
    const open = item.d[4];
    return {
      symbol: item.s.replace("PSX:", ""),
      price: parseFloat(price.toFixed(2)),
      // Change relative to Previous Day's Close
      changePercent: parseFloat(item.d[2].toFixed(2)),
      changeAbsolute: parseFloat(item.d[3].toFixed(2)),
      // Change relative to Today's Open
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(item.d[5].toFixed(2)),
      low: parseFloat(item.d[6].toFixed(2)),
      volume: item.d[7],
      lastUpdated: pktTime,
      dataDelay: "15 min (TradingView Delayed)",
    };
  });
};

const getPSXHistory = async (symbol, range, interval) => {
  const yahooSymbol = `${symbol.toUpperCase()}.KA`;
  // range=max for full history, interval=1d for daily candles
  // NOTE: Yahoo Finance often ignores intraday intervals (e.g., 15m, 1h) for PSX symbols and returns daily data instead.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${
    interval || "1d"
  }&range=${range || "max"}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0", // Yahoo sometimes blocks without UA
      },
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) {
      throw new Error("No data found in Yahoo Finance response");
    }

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    if (!timestamps || !quote) {
      return { symbol, history: [] };
    }

    const history = timestamps
      .map((ts, i) => ({
        timestamp: new Date(ts * 1000).toISOString(),
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i],
      }))
      .filter((candle) => candle.open != null && candle.close != null); // Filter out empty/null candles

    return {
      symbol: symbol.toUpperCase(),
      source: "Yahoo Finance",
      count: history.length,
      history,
    };
  } catch (err) {
    console.error(`Error fetching history for ${symbol}:`, err.message);
    throw new Error(`Failed to fetch history for ${symbol}`);
  }
};

const fetchStockNews = async (symbol) => {
  const query = encodeURIComponent(`${symbol} PSX Pakistan stock`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const news = [];

    $("item").each((i, el) => {
      if (i >= 5) return false;
      const title = $(el).find("title").text();
      const link = $(el).find("link").text();
      const pubDate = $(el).find("pubDate").text();
      const publisher = $(el).find("source").text();

      news.push({
        title,
        publisher,
        link,
        publishTime: new Date(pubDate).toISOString(),
        type: "STORY",
      });
    });

    return news;
  } catch (err) {
    console.error(`Error fetching news for ${symbol}:`, err.message);
    return [];
  }
};

async function fetchSingleStock(symbol) {
  const symbolUpper = symbol.toUpperCase();
  const psxTicker = `PSX:${symbolUpper}`;
  const yahooTicker = `${symbolUpper}.KA`;

  const tvUrl = "https://scanner.tradingview.com/pakistan/scan";
  const tvBody = {
    filter: [],
    options: { lang: "en" },
    markets: ["pakistan"],
    symbols: { query: { types: [] }, tickers: [psxTicker] },
    columns: [
      "name", "close", "change", "change_abs", "open", "high", "low", "volume", "volume_change",
      "market_cap_calc", "price_52_week_high", "price_52_week_low", "dividend_yield_recent",
      "earnings_per_share_basic_ttm", "average_volume_10d_calc", "description", "sector", "industry",
      "number_of_employees", "country", "exchange", "total_revenue", "total_assets",
      "total_debt", "net_income", "free_cash_flow", "price_book_ratio", "return_on_equity_fy",
      "return_on_assets_fy", "operating_margin_ttm", "debt_to_equity_fy", "total_shares_outstanding",
      "average_volume_90d_calc", "relative_volume_10d_calc", "recommendation_mark", "RSI",
      "MACD.macd", "MACD.signal", "EMA20", "EMA50", "EMA100", "time"
    ],
    range: [0, 1],
  };

  try {
    const [tvRes, finnhubRes, newsRes] = await Promise.all([
      axios.post(tvUrl, tvBody, {
        headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      }).then(r => r.data),
      axios.get(`${FINNHUB_BASE}/stock/profile2`, {
        params: { symbol: symbolUpper, token: process.env.FINNHUB_API_KEY }
      }).catch(() => ({ data: {} })),
      fetchStockNews(symbolUpper)
    ]);

    if (!tvRes.data || tvRes.data.length === 0) return null;

    const d = tvRes.data[0].d;
    const pktTime = new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString().replace("Z", "") + "+05:00";

    const price = d[1];
    const open = d[4];
    const eps = d[13];
    const peRatio = eps > 0 ? price / eps : null;

    const profileData = finnhubRes.data || {};

    return {
      symbol: symbolUpper,
      name: d[15] || profileData.name || symbolUpper,
      logo: profileData.logo || null,
      website: profileData.weburl || null,
      price: parseFloat(price.toFixed(2)),
      changePercent: parseFloat(d[2].toFixed(2)),
      changeAbsolute: parseFloat(d[3].toFixed(2)),
      changeFromOpen: parseFloat((price - open).toFixed(2)),
      changeFromOpenPercent: parseFloat((((price - open) / open) * 100).toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(d[5].toFixed(2)),
      low: parseFloat(d[6].toFixed(2)),
      volume: d[7],
      volumeChange: parseFloat((d[8] || 0).toFixed(2)),
      marketCap: d[9],
      high52Week: parseFloat((d[10] || 0).toFixed(2)),
      low52Week: parseFloat((d[11] || 0).toFixed(2)),
      dividendYield: parseFloat((d[12] || 0).toFixed(2)),
      eps: parseFloat((eps || 0).toFixed(2)),
      peRatio: peRatio ? parseFloat(peRatio.toFixed(2)) : null,
      avgVolume10d: d[14],
      sector: d[16] || profileData.finnhubIndustry || null,
      industry: d[17],
      profile: {
          employees: d[18] || null,
          country: d[19] || profileData.country || null,
          exchange: d[20] || profileData.exchange || "PSX",
          currency: profileData.currency || "PKR",
          ipo: profileData.ipo || null,
          phone: profileData.phone || null,
      },
      financials: {
          totalRevenue: d[21],
          totalAssets: d[22],
          totalDebt: d[23],
          netIncome: d[24],
          freeCashFlow: d[25],
          priceToBook: parseFloat((d[26] || 0).toFixed(2)),
          roe: parseFloat((d[27] || 0).toFixed(2)),
          roa: parseFloat((d[28] || 0).toFixed(2)),
          operatingMargin: parseFloat((d[29] || 0).toFixed(2)),
          debtToEquity: parseFloat((d[30] || 0).toFixed(2)),
          sharesOutstanding: d[31],
      },
      technicals: {
          avgVolume90d: d[32],
          relativeVolume: parseFloat((d[33] || 0).toFixed(2)),
          analystRating: d[34],
          rsi: parseFloat((d[35] || 0).toFixed(2)),
          macd: parseFloat((d[36] || 0).toFixed(2)),
          macdSignal: parseFloat((d[37] || 0).toFixed(2)),
          ema20: parseFloat((d[38] || 0).toFixed(2)),
          ema50: parseFloat((d[39] || 0).toFixed(2)),
          ema100: parseFloat((d[40] || 0).toFixed(2)),
      },
      news: newsRes,
      lastUpdated: pktTime,
      dataDelay: "15 min (TradingView Delayed)",
      source: "Multi-Source (TradingView, Yahoo, Finnhub, Google News)"
    };
  } catch (error) {
    console.error(`Fetch single stock multi-source failed for ${symbol}:`, error.message);
    return null;
  }
}

module.exports = {
  getLivePrice,
  getAllSharesList,
  fetchStockData,
  getCompanyProfile,
  getCandlesTwelveData,
  getPSXHistory,
  fetchPSXData,
  fetchSingleStock,
};
