// data/portfolio.js

// This is the ONLY file you’ll touch later for backend.
// Keep the returned shape the same.

const SAMPLE_PORTFOLIO = {
  positions: [
    {
      ticker: "AAPL",
      name: "Apple",
      quantity: 15,
      avgPrice: 210.5,
      currentPrice: 228.54,
    },
    {
      ticker: "NVDA",
      name: "NVIDIA",
      quantity: 8,
      avgPrice: 115.2,
      currentPrice: 123.91,
    },
    {
      ticker: "TSLA",
      name: "Tesla",
      quantity: 5,
      avgPrice: 240.0,
      currentPrice: 254.02,
    },
  ],
  summary: {
    totalInvested: 0, // will be filled below
    currentValue: 0,
    pl: 0,
    plPercent: 0,
  },
  distribution: [], // [{ ticker, value }]
  predictions: [
    { day: 0, value: 100 },
    { day: 10, value: 105 },
    { day: 20, value: 109 },
    { day: 30, value: 112 },
  ],
};

function enrichSample() {
  const p = SAMPLE_PORTFOLIO;
  let invested = 0;
  let current = 0;

  p.positions.forEach((pos) => {
    invested += pos.quantity * pos.avgPrice;
    current += pos.quantity * pos.currentPrice;
  });

  p.summary.totalInvested = invested;
  p.summary.currentValue = current;
  p.summary.pl = current - invested;
  p.summary.plPercent = invested ? ((current - invested) / invested) * 100 : 0;

  p.distribution = p.positions.map((pos) => ({
    ticker: pos.ticker,
    value: pos.quantity * pos.currentPrice,
  }));

  return p;
}

export async function fetchPortfolio() {
  // later: replace this with real fetch(...)
  await new Promise((r) => setTimeout(r, 150));
  return enrichSample();
}
