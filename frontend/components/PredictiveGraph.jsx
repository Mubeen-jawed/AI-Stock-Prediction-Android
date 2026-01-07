// PredictiveGraph.jsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LineChart } from "react-native-wagmi-charts";

const DAY = 24 * 60 * 60 * 1000;

// Safe parse for "YYYY-MM-DD" into UTC midnight (ms)
function toMs(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function niceStep(rawStep) {
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const n = rawStep / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function buildYTicks(min, max, count = 5) {
  if (count < 2) return [min];
  const raw = (max - min) / (count - 1);
  const step = niceStep(raw || 1);
  const start = Math.floor(min / step) * step;
  return Array.from({ length: count }, (_, i) => start + i * step);
}

function formatDay(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "2-digit" });
}

export default function PredictiveGraph({
  predictions = [],
  loading = false,
  title = "Next 15 Days AI Price Prediction",
  fixedDays = 7,
}) {
  // 1) Map predictions -> wagmi data
  const data = useMemo(() => {
    if (!Array.isArray(predictions) || predictions.length === 0) return [];

    const mapped = predictions
      .map((p) => {
        const ts = toMs(p.date);
        const value = Number(p.price);
        if (!ts || !Number.isFinite(value)) return null;
        return { timestamp: ts, value };
      })
      .filter(Boolean);

    mapped.sort((a, b) => a.timestamp - b.timestamp);
    return mapped;
  }, [predictions]);

  // UI sizing
  const screenW = Dimensions.get("window").width;
  const CHART_HEIGHT = 220;
  const Y_AXIS_W = 56;
  const PADDING_X = 6;

  const chartW = Math.max(
    220,
    Math.min(340, screenW - PADDING_X * 2 - Y_AXIS_W)
  );

  // 2) Fixed X domain (last N days ending at last point)
  const xDomain = useMemo(() => {
    if (!data.length) return undefined;
    const maxTs = data[data.length - 1].timestamp;
    const minTs = maxTs - fixedDays * DAY;
    return [minTs, maxTs];
  }, [data, fixedDays]);

  // 3) Fixed Y range based on data values (padded + rounded)
  const yRange = useMemo(() => {
    if (!data.length) return undefined;

    let min = Infinity;
    let max = -Infinity;

    for (const p of data) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
    if (min === max) return { min: min - 1, max: max + 1 };

    const pad = (max - min) * 0.02;
    const step = niceStep((max - min) / 4 || 1);

    const yMin = Math.floor((min - pad) / step) * step;
    const yMax = Math.ceil((max + pad) / step) * step;

    return { min: yMin, max: yMax };
  }, [data]);

  // 4) Y ticks (left labels)
  const yTicks = useMemo(() => {
    if (!yRange) return [];
    return buildYTicks(yRange.min, yRange.max, 5).slice().reverse();
  }, [yRange]);

  // 5) X ticks (bottom labels)
  const xTicks = useMemo(() => {
    if (!xDomain) return [];
    const [minTs, maxTs] = xDomain;
    const count = 5;

    return Array.from({ length: count }, (_, i) => {
      const ts = minTs + (i * (maxTs - minTs)) / (count - 1);
      const snapped = Math.round(ts / DAY) * DAY;
      return snapped;
    });
  }, [xDomain]);

  if (loading) {
    return (
      <View
        style={{
          height: 320,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#101014",
          marginTop: 20,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!data.length) {
    return (
      <View
        style={{
          height: 320,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#101014",
          marginTop: 20,
        }}
      >
        <Text style={{ color: "#A7B1BC" }}>No chart data</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 50 }}>
      <View style={styles.bybitHeader}>
        <Text style={styles.bybitTitle}>AI Price Forecast</Text>
        <View style={styles.bybitUnderline} />
      </View>

      <View
        style={{
          borderRadius: 14,
          backgroundColor: "#101014",
          marginTop: 20,
          paddingVertical: 16,
          paddingHorizontal: PADDING_X,
        }}
      >
        {/* Title */}

        <LineChart.Provider data={data} yRange={yRange} xDomain={xDomain}>
          {/* Row: Y labels + Chart */}
          <Text
            style={{
              color: "#8B96A5",
              fontSize: 12,
              position: "absolute",
              top: 12,
              left: PADDING_X + 8,
              fontWeight: "600",
            }}
          >
            Next 15 Days Prediction
          </Text>

          <View style={{ flexDirection: "row-reverse", marginTop: 12 }}>
            {/* Y-axis labels */}
            <View
              style={{
                width: Y_AXIS_W - 20,
                height: CHART_HEIGHT - 20,
                justifyContent: "space-between",
                paddingRight: 0,
              }}
            >
              {yTicks.map((v) => (
                <Text key={String(v)} style={{ color: "#8B96A5", fontSize: 9 }}>
                  {Number(v).toFixed(2)}
                </Text>
              ))}
            </View>

            {/* Chart */}
            <View
              style={{
                width: chartW,
                height: CHART_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LineChart
                width={chartW - 25}
                height={CHART_HEIGHT}
                // style={{ marginTop: 110 }}
              >
                <LineChart.Path color="#4ADE80">
                  <LineChart.Gradient />
                </LineChart.Path>

                <LineChart.CursorLine
                  style={{ height: CHART_HEIGHT }}
                  color="#374151"
                  textStyle={{ color: "#E6EEF8" }}
                />
              </LineChart>

              {/* Optional: cursor price */}
              <View style={{ position: "absolute", top: 6, left: 6 }}>
                <LineChart.PriceText
                  style={{
                    color: "#E6EEF8",
                    fontSize: 12,
                    fontWeight: "600",
                    marginLeft: 5,
                  }}
                />
              </View>

              {/* <View style={{ position: "absolute", bottom: 6, right: 10 }}>
              <LineChart.DatetimeText
                style={{ color: "#E6EEF8", fontSize: 12, fontWeight: "600" }}
              />
            </View> */}
            </View>
          </View>

          {/* X-axis labels under chart */}
          <View
            style={{
              marginTop: 8,
              marginLeft: Y_AXIS_W - 50,
              width: chartW - 20,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {xTicks.map((ts) => (
              <Text key={String(ts)} style={{ color: "#9CA3AF", fontSize: 9 }}>
                {formatDay(ts)}
              </Text>
            ))}
          </View>
        </LineChart.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bybitHeader: {
    marginBottom: 12,
  },

  bybitTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  bybitUnderline: {
    marginTop: 6,
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFD700", // gold accent
  },
});
