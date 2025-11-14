// Minimal mock + drop-in API adapter.
// Later: replace fetchStocks(...) with a real HTTP call.

const SAMPLE = [
  {
    logo: "https://logo.clearbit.com/apple.com",
    name: "Apple",
    ticker: "AAPL",
    price: 228.54,
    pct: -0.64,
    vol: "12.8B",
  },
  {
    logo: "https://logo.clearbit.com/nvidia.com",
    name: "NVIDIA",
    ticker: "NVDA",
    price: 123.88,
    pct: 3.35,
    vol: "18.3B",
  },
  {
    logo: "https://logo.clearbit.com/tesla.com",
    name: "Tesla",
    ticker: "TSLA",
    price: 254.02,
    pct: -3.07,
    vol: "9.1B",
  },
  {
    logo: "https://logo.clearbit.com/microsoft.com",
    name: "Microsoft",
    ticker: "MSFT",
    price: 425.62,
    pct: 10.29,
    vol: "7.4B",
  },
  {
    logo: "https://logo.clearbit.com/google.com",
    name: "Alphabet",
    ticker: "GOOGL",
    price: 177.4,
    pct: -4.26,
    vol: "6.2B",
  },
  {
    logo: "https://logo.clearbit.com/ethereum.org",
    name: "Ethereum ETF",
    ticker: "ETH",
    price: 3545.62,
    pct: -0.99,
    vol: "5.3B",
  },
];

// for backend API later

// export async function fetchStocks(params) {
//   const qs = new URLSearchParams(params).toString();
//   const res = await fetch(`https://YOUR_API/stocks?${qs}`);
//   return await res.json();
// }

// mock implementation for now
export async function fetchStocks({
  topTab = "Favorites",
  subTab = "Spot",
  q = "",
}) {
  // simulate API latency
  await new Promise((r) => setTimeout(r, 150));

  // simple demo filters so UI feels real; swap with backend params later
  let rows = SAMPLE;
  if (topTab === "Gainers")
    rows = [...SAMPLE].sort((a, b) => b.pct - a.pct).slice(0, 5);
  if (topTab === "Pre-Market")
    rows = SAMPLE.filter((x) => ["AAPL", "MSFT"].includes(x.ticker));
  if (q)
    rows = rows.filter((x) =>
      (x.name + x.ticker).toLowerCase().includes(q.toLowerCase())
    );

  return rows;
}

export async function fetchAllStocks() {
  await new Promise((r) => setTimeout(r, 150));
  return SAMPLE;
}
