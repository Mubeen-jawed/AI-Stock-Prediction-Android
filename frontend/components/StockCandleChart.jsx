import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, Dimensions } from "react-native";
import { CandlestickChart } from "react-native-wagmi-charts";

// Your existing helper (keep yours)
// function parseTimestamp(ts) {
//   // accepts seconds or ms; returns ms
//   const n = Number(ts);
//   if (!Number.isFinite(n)) return null;
//   return n < 1e12 ? n * 1000 : n;
// }

// console.log("CandlestickChart is", CandlestickChart);

function toMsTimestamp(t) {
  if (t == null) return null;

  // if already a number (ms)
  if (typeof t === "number" && Number.isFinite(t)) return t;

  // If your backend ever sends seconds (10-digit), convert to ms
  if (typeof t === "string" && /^\d+$/.test(t)) {
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return n < 1e12 ? n * 1000 : n; // seconds -> ms
  }

  if (typeof t !== "string") return null;

  // Handle "YYYY-MM-DD HH:mm:ss" by converting to ISO-ish
  // NOTE: This will parse as local time of the device.
  const isoLike = t.includes("T") ? t : t.replace(" ", "T");
  const ms = Date.parse(isoLike);

  return Number.isFinite(ms) ? ms : null;
}

function downsampleCandles(candles, chartWidth) {
  if (!Array.isArray(candles) || candles.length === 0) return [];

  // How many candles can we reasonably draw on this width?
  // 5–7px per candle+gap is usually the sweet spot on mobile.
  const pxPerCandle = 6;
  const maxCandles = Math.max(40, Math.floor(chartWidth / pxPerCandle));

  if (candles.length <= maxCandles) return candles;

  const step = Math.ceil(candles.length / maxCandles);
  const result = [];

  // Bucket candles and keep the last one in each bucket (keeps “latest” shape)
  for (let i = 0; i < candles.length; i += step) {
    result.push(candles[Math.min(i + step - 1, candles.length - 1)]);
  }

  return result;
}

// console.log("CandlestickChart", CandlestickChart);
// console.log("Provider", CandlestickChart?.Provider);
// console.log("Grid", CandlestickChart?.Grid);
// console.log("Tooltip", CandlestickChart?.Tooltip);

export default function StockCandleChart({ chart, loading, height = 300 }) {
  // console.log(CandlestickChart());
  const W = Dimensions.get("window").width;

  const candleData = useMemo(() => {
    const candles = chart?.candles; // supports a few shapes
    if (!Array.isArray(candles) || candles.length === 0) return [];

    return candles
      .map((p) => {
        const timestamp = toMsTimestamp(p.timestamp);
        if (timestamp == null) return null;

        const open = Number(p.open);
        const high = Number(p.high);
        const low = Number(p.low);
        const close = Number(p.close);

        if (![open, high, low, close].every(Number.isFinite)) return null;

        return { timestamp, open, high, low, close };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [chart]);

  const chartWidth = W - 32; // same width you pass to CandlestickChart
  const displayCandles = useMemo(
    () => downsampleCandles(candleData, chartWidth),
    [candleData, chartWidth]
  );

  if (loading) {
    return (
      <View
        style={{
          height,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0E11",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!candleData.length) {
    return (
      <View
        style={{
          height,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0E11",
        }}
      >
        <Text style={{ color: "#A7B1BC" }}>No chart data</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#0B0E11",
        borderRadius: 14,
        paddingVertical: 10,
      }}
    >
      <CandlestickChart.Provider data={candleData}>
        <CandlestickChart height={height} width={W - 32}>
          <CandlestickChart.Candles />
          <CandlestickChart.Crosshair>
            <CandlestickChart.Tooltip />
          </CandlestickChart.Crosshair>
        </CandlestickChart>
      </CandlestickChart.Provider>
    </View>
  );
}
