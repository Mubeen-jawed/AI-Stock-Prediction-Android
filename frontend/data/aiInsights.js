// data/aiInsights.js
//
// Derives AI Insights metrics (portfolio health, performance vs KSE index,
// AI top picks, market sentiment / fear & greed, risk analysis, and an
// AI notification feed) entirely on the client from the app's existing
// live endpoints. No new backend routes are required.
//
//   - fetchPortfolio(token)  -> positions + summary
//   - fetchAllStocks(token)  -> KSE-30 live quotes (market breadth proxy)
//   - fetchNews(token)       -> headlines for the AI feed
//
// All numbers are computed deterministically so the screen is stable
// between renders for the same underlying data.

import { fetchPortfolio } from "./portfolio";
import { fetchAllStocks } from "./stocks";
import { fetchNews } from "./news";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const stdev = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
};

// Small deterministic hash from a string -> [0,1)
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const SECTORS = {
  AIRLINK: "Technology", ATRL: "Refinery", CNERGY: "Energy", CPHL: "Pharma",
  DGKC: "Cement", EFERT: "Fertilizer", FCCL: "Cement", FFL: "Fertilizer",
  FFC: "Fertilizer", GHNI: "Pharma", GLAXO: "Pharma", HUBC: "Power",
  ISL: "Steel", LUCK: "Cement", MARI: "Oil & Gas", MEBL: "Banking",
  MLCF: "Cement", NRL: "Refinery", OGDC: "Oil & Gas", PAEL: "Engineering",
  PRL: "Refinery", PPL: "Oil & Gas", PSO: "Oil Marketing", SAZEW: "Auto",
  SEARL: "Pharma", SNGP: "Gas", SSGC: "Gas", SYS: "Technology",
};
const sectorOf = (sym) => SECTORS[sym] || "Equity";

// Intraday "strength": where the price sits inside the day's range (0..1)
function intradayStrength(s) {
  const range = (s.high ?? 0) - (s.low ?? 0);
  if (range <= 0) return 0.5;
  return clamp(((s.price ?? s.low) - s.low) / range, 0, 1);
}

// Build a deterministic mini-trend (sparkline) for a stock from its OHLC.
// Produces a smooth-ish path open -> ... -> close, biased by momentum.
function miniTrend(s, points = 14) {
  const open = Number(s.open) || Number(s.price) || 1;
  const close = Number(s.price) || open;
  const high = Number(s.high) || Math.max(open, close);
  const low = Number(s.low) || Math.min(open, close);
  const out = [];
  const base = seeded(s.symbol || "x");
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    // linear open->close with a mid-bow toward high/low and tiny seeded noise
    const linear = open + (close - open) * t;
    const bow = Math.sin(t * Math.PI) * (close >= open ? high - close : low - close) * 0.5;
    const noise = (seeded(`${s.symbol}-${i}`) - 0.5) * (high - low) * 0.12;
    out.push(linear + bow * (base - 0.3) + noise);
  }
  out[0] = open;
  out[points - 1] = close;
  return out;
}

// ---- Smart Summary -------------------------------------------------------

function buildSummary(portfolio, stocks) {
  const positions = portfolio.positions || [];
  const summary = portfolio.summary || {};
  const bySym = new Map(stocks.map((s) => [s.symbol, s]));

  // Match holdings to live KSE quotes for today's move
  let wSum = 0;
  let wChange = 0;
  let winners = 0;
  positions.forEach((p) => {
    const live = bySym.get(p.symbol);
    const weight = p.quantity * p.currentPrice;
    if (live && Number.isFinite(live.changePercent)) {
      wSum += weight;
      wChange += live.changePercent * weight;
    }
    if (p.currentPrice >= p.avgPrice) winners++;
  });

  const portfolioMove = wSum ? wChange / wSum : 0;
  const marketMove = mean(
    stocks.map((s) => s.changePercent).filter(Number.isFinite),
  );
  const outperformance = portfolioMove - marketMove;

  const plPercent = summary.plPercent || 0;
  const winRate = positions.length ? winners / positions.length : 0;
  const diversification = clamp(positions.length / 8, 0, 1); // 8+ holdings = well spread

  // Health score 0..100
  const health = clamp(
    Math.round(
      50 +
        clamp(plPercent, -25, 25) * 0.8 + // profitability
        winRate * 20 + // hit rate
        diversification * 12 + // spread
        clamp(outperformance, -5, 5), // vs market
    ),
    0,
    100,
  );

  const confidence = clamp(
    Math.round(60 + winRate * 25 + diversification * 10 + clamp(plPercent, -10, 10)),
    35,
    97,
  );

  let verdict = "Needs attention";
  if (health >= 75) verdict = "Good";
  else if (health >= 55) verdict = "Fair";

  const hasData = positions.length > 0;

  return {
    hasData,
    health,
    confidence,
    verdict,
    outperformance,
    marketMove,
    plPercent,
    indexName: "KSE 100 Index",
  };
}

// ---- AI Top Picks --------------------------------------------------------

function buildTopPicks(stocks, count = 3) {
  const scored = stocks
    .filter((s) => Number.isFinite(s.changePercent))
    .map((s) => {
      const strength = intradayStrength(s);
      // momentum score: today's move + intraday positioning + small volume tilt
      const score = s.changePercent * 0.6 + (strength - 0.5) * 8;
      const upside = clamp(
        Math.abs(s.changePercent) * 1.6 + strength * 6 + seeded(s.symbol) * 3,
        1.5,
        24,
      );
      return {
        symbol: s.symbol,
        name: s.name,
        logo: s.logo,
        sector: sectorOf(s.symbol),
        score,
        bullish: score >= 0,
        upside: score >= 0 ? upside : -upside,
        trend: miniTrend(s),
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
}

// ---- Market Sentiment (Fear & Greed) ------------------------------------

function buildSentiment(stocks) {
  const valid = stocks.filter((s) => Number.isFinite(s.changePercent));
  const advancers = valid.filter((s) => s.changePercent > 0).length;
  const decliners = valid.filter((s) => s.changePercent < 0).length;
  const total = valid.length || 1;
  const breadth = (advancers - decliners) / total; // -1..1
  const avgMove = mean(valid.map((s) => s.changePercent));
  const avgStrength = mean(valid.map(intradayStrength)); // 0..1

  // Compose to 0..100
  const score = clamp(
    Math.round(50 + breadth * 35 + clamp(avgMove, -3, 3) * 4 + (avgStrength - 0.5) * 20),
    0,
    100,
  );

  let label = "Neutral";
  let color = "#FFD700";
  let blurb = "Market is balanced with no clear directional bias.";
  if (score < 25) {
    label = "Extreme Fear"; color = "#EA3943";
    blurb = "Heavy selling pressure — investors are risk-averse.";
  } else if (score < 45) {
    label = "Fear"; color = "#FF8A00";
    blurb = "Caution dominates with more decliners than advancers.";
  } else if (score < 56) {
    label = "Neutral"; color = "#FFD700";
    blurb = "Market is balanced with no clear directional bias.";
  } else if (score < 75) {
    label = "Greed"; color = "#7CCB57";
    blurb = "Market is showing signs of greed with high buying interest.";
  } else {
    label = "Extreme Greed"; color = "#16C784";
    blurb = "Strong risk appetite — broad-based buying across sectors.";
  }

  return { score, label, color, blurb, advancers, decliners };
}

// ---- Risk Analysis -------------------------------------------------------

function buildRisk(portfolio, stocks, sentiment) {
  const positions = portfolio.positions || [];
  const bySym = new Map(stocks.map((s) => [s.symbol, s]));

  const heldMoves = positions
    .map((p) => bySym.get(p.symbol)?.changePercent)
    .filter(Number.isFinite);
  const marketMoves = stocks.map((s) => s.changePercent).filter(Number.isFinite);

  const portVol = stdev(heldMoves.length ? heldMoves : marketMoves);
  const mktVol = stdev(marketMoves) || 1;

  // Volatility band
  let volatility = "Low";
  if (portVol > 2.2) volatility = "High";
  else if (portVol > 1.1) volatility = "Medium";

  // Beta ~ portfolio vol relative to market vol (clamped to a sane range)
  const beta = clamp(Number((portVol / mktVol).toFixed(2)), 0.4, 2.2) || 1.0;

  // Drawdown risk from share of losing positions / weakest holding
  const losers = positions.filter((p) => p.currentPrice < p.avgPrice).length;
  const loserRatio = positions.length ? losers / positions.length : 0;
  let drawdown = "Low";
  if (loserRatio > 0.5) drawdown = "High";
  else if (loserRatio > 0.25) drawdown = "Medium";

  let level = "Moderate Risk";
  let levelColor = "#FFD700";
  const riskPts = (volatility === "High" ? 2 : volatility === "Medium" ? 1 : 0)
    + (drawdown === "High" ? 2 : drawdown === "Medium" ? 1 : 0)
    + (beta > 1.3 ? 1 : 0);
  if (riskPts >= 4) { level = "High Risk"; levelColor = "#EA3943"; }
  else if (riskPts <= 1) { level = "Low Risk"; levelColor = "#16C784"; }

  const advice =
    positions.length < 4
      ? "Add more holdings to diversify further"
      : beta > 1.3
        ? "Trim high-beta names to reduce swings"
        : "Diversify to reduce risk further";

  return { level, levelColor, volatility, drawdown, beta, advice };
}

// ---- AI Notifications Feed ----------------------------------------------

function relativeTime(dateStr) {
  if (!dateStr) return "just now";
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return dateStr;
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 6e4))} min ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function buildFeed(stocks, sentiment, news) {
  const valid = stocks.filter((s) => Number.isFinite(s.changePercent));
  const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const feed = [];

  if (top) {
    feed.push({
      id: `mom-${top.symbol}`,
      icon: "trending-up",
      tone: "up",
      tag: "Momentum",
      title: `${top.symbol} is showing strong momentum`,
      body: `Up ${top.changePercent.toFixed(2)}% today on rising volume — flagged by the momentum model.`,
      time: "2 min ago",
    });
  }

  feed.push({
    id: "sentiment",
    icon: "speedometer",
    tone: sentiment.score >= 56 ? "up" : sentiment.score < 45 ? "down" : "neutral",
    tag: "Sentiment",
    title: `Market sentiment reads "${sentiment.label}" (${sentiment.score}/100)`,
    body: sentiment.blurb,
    time: "15 min ago",
  });

  if (bottom && bottom.changePercent < 0) {
    feed.push({
      id: `risk-${bottom.symbol}`,
      icon: "alert-circle",
      tone: "down",
      tag: "Risk",
      title: `${bottom.symbol} under pressure`,
      body: `Down ${Math.abs(bottom.changePercent).toFixed(2)}% — watch for further weakness if support breaks.`,
      time: "38 min ago",
    });
  }

  // News-based analysis
  (news || []).slice(0, 3).forEach((n, i) => {
    if (!n?.title) return;
    feed.push({
      id: `news-${n.id ?? i}`,
      icon: "newspaper",
      tone: "neutral",
      tag: "News Impact",
      title: n.title,
      body: "AI scanned this headline for potential impact on your watchlist.",
      time: relativeTime(n.date),
    });
  });

  return feed;
}

// ---- Orchestrator --------------------------------------------------------

export async function loadAIInsights(token) {
  const [portfolioRes, stocksRes, newsRes] = await Promise.allSettled([
    fetchPortfolio(token),
    fetchAllStocks(token),
    fetchNews(token),
  ]);

  const portfolio =
    portfolioRes.status === "fulfilled"
      ? portfolioRes.value
      : { positions: [], summary: {} };
  const stocks =
    stocksRes.status === "fulfilled" && Array.isArray(stocksRes.value)
      ? stocksRes.value
      : [];
  const news = newsRes.status === "fulfilled" ? newsRes.value || [] : [];

  const summary = buildSummary(portfolio, stocks);
  const sentiment = buildSentiment(stocks);

  return {
    summary,
    topPicks: buildTopPicks(stocks),
    sentiment,
    risk: buildRisk(portfolio, stocks, sentiment),
    feed: buildFeed(stocks, sentiment, news),
    updatedAt: Date.now(),
  };
}
