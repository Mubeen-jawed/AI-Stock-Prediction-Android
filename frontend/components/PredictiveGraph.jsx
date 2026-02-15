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
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function niceStep(rawStep) {
  if (rawStep <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const n = rawStep / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function buildYTicks(min, max, count = 5) {
  if (count < 2) return [min];
  if (min === max) return [min];

  const raw = (max - min) / (count - 1);
  const step = niceStep(raw || 1);
  const start = Math.floor(min / step) * step;

  const ticks = [];
  for (let i = 0; i < count; i++) {
    const tick = start + i * step;
    if (tick >= min - step * 0.1 && tick <= max + step * 0.1) {
      ticks.push(tick);
    }
  }

  return ticks.length > 0 ? ticks : [min, max];
}

function formatDay(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatYValue(value) {
  if (value >= 1000) {
    return value.toFixed(0);
  } else if (value >= 100) {
    return value.toFixed(1);
  } else {
    return value.toFixed(2);
  }
}

export default function PredictiveGraph({
  predictions = null,
  loading = false,
  title = "AI Price Forecast",
  fixedDays = 15,
}) {
  // Extract predictions array from API response
  const predictionData = useMemo(() => {
    if (!predictions) return [];

    // Handle both direct array and object with predictions property
    const dataArray = Array.isArray(predictions)
      ? predictions
      : predictions.predictions || [];

    return dataArray;
  }, [predictions]);

  // Map predictions to chart data
  const data = useMemo(() => {
    if (!Array.isArray(predictionData) || predictionData.length === 0)
      return [];

    const mapped = predictionData
      .map((p) => {
        const ts = toMs(p.date);
        const value = Number(p.price);
        if (!ts || !Number.isFinite(value)) return null;
        return { timestamp: ts, value };
      })
      .filter(Boolean);

    mapped.sort((a, b) => a.timestamp - b.timestamp);
    return mapped;
  }, [predictionData]);

  // UI sizing
  const screenW = Dimensions.get("window").width;
  const CHART_HEIGHT = 220;
  const Y_AXIS_W = 56;
  const PADDING_X = 16;

  const chartW = screenW - PADDING_X * 2 - Y_AXIS_W;

  // Fixed X domain (based on actual data range)
  const xDomain = useMemo(() => {
    if (!data.length) return undefined;
    const minTs = data[0].timestamp;
    const maxTs = data[data.length - 1].timestamp;
    return [minTs, maxTs];
  }, [data]);

  // Fixed Y range based on data values (padded + rounded)
  const yRange = useMemo(() => {
    if (!data.length) return undefined;

    let min = Infinity;
    let max = -Infinity;

    for (const p of data) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
    if (min === max) return { min: min * 0.95, max: max * 1.05 };

    const pad = (max - min) * 0.05; // 5% padding
    const step = niceStep((max - min) / 4 || 1);

    const yMin = Math.floor((min - pad) / step) * step - 3;
    const yMax = Math.ceil((max + pad) / step) * step;

    return { min: yMin, max: yMax };
  }, [data]);

  // Y ticks (right labels)
  const yTicks = useMemo(() => {
    if (!yRange) return [];
    return buildYTicks(yRange.min, yRange.max, 5).slice().reverse();
  }, [yRange]);

  // X ticks (bottom labels)
  const xTicks = useMemo(() => {
    if (!xDomain || !data.length) return [];

    const count = Math.min(5, data.length);
    const ticks = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.round((i * (data.length - 1)) / (count - 1));
      ticks.push(data[idx].timestamp);
    }

    return ticks;
  }, [xDomain, data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.bybitHeader}>
          <Text style={styles.bybitTitle}>AI Price Forecast</Text>
          <View style={styles.bybitUnderline} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#4ADE80" size="large" />
          <Text style={styles.loadingText}>Generating predictions...</Text>
        </View>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View style={styles.container}>
        <View style={styles.bybitHeader}>
          <Text style={styles.bybitTitle}>AI Price Forecast</Text>
          <View style={styles.bybitUnderline} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No prediction data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bybitHeader}>
        <Text style={styles.bybitTitle}>AI Price Forecast</Text>
        <View style={styles.bybitUnderline} />
      </View>

      <View style={styles.chartContainer}>
        <LineChart.Provider data={data} yRange={yRange} xDomain={xDomain}>
          {/* Title */}
          <Text style={styles.chartTitle}>
            Next {predictionData.length} Days Prediction
          </Text>

          {/* Cursor price (top) */}
          <View style={styles.cursorPriceContainer}>
            <LineChart.PriceText style={styles.cursorPrice} />
            <LineChart.DatetimeText style={styles.cursorDate} />
          </View>

          {/* Chart + Y-axis */}
          <View style={styles.chartRow}>
            {/* Chart */}
            <View style={styles.chartWrapper}>
              <LineChart width={chartW} height={CHART_HEIGHT}>
                <LineChart.Path color="#4ADE80" width={2}>
                  <LineChart.Gradient color="#4ADE80" />
                </LineChart.Path>

                <LineChart.CursorCrosshair
                  color="#6B7280"
                  outerSize={40}
                  size={8}
                >
                  <LineChart.Tooltip
                    position="top"
                    textStyle={styles.tooltipText}
                  />
                </LineChart.CursorCrosshair>
              </LineChart>
            </View>

            {/* Y-axis labels */}
            <View style={styles.yAxisContainer}>
              {yTicks.map((v, i) => (
                <Text key={`y-${i}`} style={styles.yAxisLabel}>
                  {formatYValue(v)}
                </Text>
              ))}
            </View>
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            <View style={styles.xAxisLabels}>
              {xTicks.map((ts, i) => (
                <Text key={`x-${i}`} style={styles.xAxisLabel}>
                  {formatDay(ts)}
                </Text>
              ))}
            </View>
          </View>
        </LineChart.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },

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
    backgroundColor: "#4ADE80",
  },

  loadingContainer: {
    height: 320,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101014",
    marginTop: 12,
  },

  loadingText: {
    color: "#A7B1BC",
    fontSize: 13,
    marginTop: 12,
  },

  emptyContainer: {
    height: 320,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101014",
    marginTop: 12,
  },

  emptyText: {
    color: "#A7B1BC",
    fontSize: 14,
  },

  chartContainer: {
    borderRadius: 14,
    backgroundColor: "#101014",
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },

  chartTitle: {
    color: "#8B96A5",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },

  cursorPriceContainer: {
    marginBottom: 8,
  },

  cursorPrice: {
    color: "#E6EEF8",
    fontSize: 14,
    fontWeight: "600",
  },

  cursorDate: {
    color: "#A7B1BC",
    fontSize: 10,
    marginTop: 2,
  },

  chartRow: {
    flexDirection: "row",
  },

  chartWrapper: {
    flex: 1,
  },

  yAxisContainer: {
    width: 56,
    height: 220,
    justifyContent: "space-between",
    paddingLeft: 30,
    paddingVertical: 2,
  },

  yAxisLabel: {
    color: "#8B96A5",
    fontSize: 9,
    fontWeight: "500",
  },

  xAxisContainer: {
    marginTop: 8,
  },

  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 30,
  },

  xAxisLabel: {
    color: "#8B96A5",
    fontSize: 9,
    fontWeight: "500",
  },

  tooltipText: {
    color: "#E6EEF8",
    fontSize: 11,
    fontWeight: "600",
  },
});
