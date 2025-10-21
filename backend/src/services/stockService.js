import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FINNHUB_BASE = "https://finnhub.io/api/v1";

export const getLivePrice = async (symbol) => {
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
