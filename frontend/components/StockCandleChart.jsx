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

function getMinMax(candles) {
  let min = Infinity,
    max = -Infinity;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}

function niceStep(rawStep) {
  // rounds step to 1/2/5 * 10^n
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const n = rawStep / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function buildYTicks(min, max, count = 4) {
  const raw = (max - min) / (count - 1);
  const step = niceStep(raw);
  const start = Math.floor(min / step) * step;
  const ticks = Array.from({ length: count }, (_, i) => start + i * step);
  return ticks;
}

function buildXTicks(candles, count = 4) {
  if (!candles?.length) return [];
  const last = candles.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.round((i * last) / (count - 1));
    return { idx, ts: candles[idx].timestamp };
  });
}

function formatX(ts, rangeKey) {
  const d = new Date(ts);
  if (rangeKey === "1D")
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (rangeKey === "5D") return d.toLocaleDateString([], { weekday: "short" });
  if (rangeKey === "1M")
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
  return d.toLocaleDateString([], { month: "short", year: "2-digit" }); // 6M / 1Y / ALL
}

export default function StockCandleChart({ chart, loading, rangeKey }) {
  const W = Dimensions.get("window").width;

  console.log(rangeKey);

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

  const chartWidth = W - 100; // same width you pass to CandlestickChart
  const displayCandles = useMemo(
    () => downsampleCandles(candleData, chartWidth),
    [candleData, chartWidth]
  );

  const AXIS_Y_W = 40; // right labels width
  const CHART_W = W - 40 - AXIS_Y_W;

  const { min, max } = useMemo(
    () => getMinMax(displayCandles),
    [displayCandles]
  );
  const yTicks = useMemo(() => buildYTicks(min, max, 5), [min, max]);
  const xTicks = useMemo(
    () => buildXTicks(displayCandles, 5),
    [displayCandles]
  );

  if (loading) {
    return (
      <View
        style={{
          height: 300,
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
          height: 300,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#101014",
        }}
      >
        <Text style={{ color: "#A7B1BC" }}>No chart data</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#101014",
        borderRadius: 14,
        paddingBottom: 20,
      }}
    >
      {/* IMPORTANT: feed displayCandles (downsampled) */}
      <CandlestickChart.Provider data={displayCandles}>
        {/* Crosshair labels (interactive) */}
        <View style={{ paddingHorizontal: 0, paddingBottom: 6 }}>
          <CandlestickChart.PriceText
            style={{
              color: "#E6EEF8",
              fontSize: 12,
              fontWeight: "600",
              marginLeft: 6,
            }}
          />
          <CandlestickChart.DatetimeText
            style={{
              color: "#A7B1BC",
              fontSize: 9,
              marginTop: 0,
              marginLeft: 6,
            }}
          />
        </View>

        {/* Chart + Y axis */}
        <View style={{ flexDirection: "row-reverse", paddingHorizontal: 0 }}>
          {/* Y axis labels */}
          <View
            style={{
              width: AXIS_Y_W,
              justifyContent: "space-between",
              paddingLeft: 0,
              height: 250,
            }}
          >
            {yTicks
              .slice()
              .reverse()
              .map((v) => (
                <Text key={String(v)} style={{ color: "#8B96A5", fontSize: 9 }}>
                  {v.toFixed(2)}
                </Text>
              ))}
          </View>

          {/* Chart */}
          <View style={{ width: CHART_W }}>
            <CandlestickChart
              height={250}
              width={CHART_W - 25}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 15,
              }}
            >
              {/* <CandlestickChart.Grid /> */}
              <CandlestickChart.Candles />
              <CandlestickChart.Crosshair>
                <CandlestickChart.Tooltip />
              </CandlestickChart.Crosshair>
            </CandlestickChart>
          </View>
        </View>

        {/* X axis labels */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 0,
            paddingTop: 8,
            justifyContent: "left",
            marginLeft: 21,
          }}
        >
          <View style={{ width: AXIS_Y_W - 35 }} />
          <View
            style={{
              width: CHART_W - 30,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {xTicks.map((t) => (
              <Text key={t.idx} style={{ color: "#8B96A5", fontSize: 9 }}>
                {formatX(t.ts, rangeKey)}
              </Text>
            ))}
          </View>
        </View>
      </CandlestickChart.Provider>
    </View>
  );
}
