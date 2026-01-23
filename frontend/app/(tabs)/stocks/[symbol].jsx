import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { API_URL } from "../../config/config";
import Loader from "../../../components/Loader";
import StockCandleChart from "../../../components/StockCandleChart";
import PredictiveGraph from "../../../components/PredictiveGraph";

const TIME_RANGES = ["1D", "5D", "1M", "6M", "1Y"];

export default function StockDetailScreen({ navigation }) {
  const router = useRouter();
  const { symbol } = useLocalSearchParams();
  const { token } = useAuth();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState("1D");

  const [watchlist, setWatchlist] = useState([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const [chart, setChart] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  // const [predictions, setPredictions] = useState(null);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    if (!symbol || !token) return;

    const fetchChart = async () => {
      try {
        setChartLoading(true);

        const res = await fetch(
          `${API_URL}/api/stocks/chart/${symbol}?range=${selectedRange}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setChart(data);
      } catch (e) {
        console.log("Chart error:", e);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChart();
  }, [symbol, token, selectedRange]);

  useEffect(() => {
    if (!symbol || !token) return;

    const fetchStock = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/stocks/price/${symbol}?exchange=US`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status ${res.status}: ${text}`);
        }

        const data = await res.json();
        // Expecting shape:
        // { symbol, currentPrice, open, high, low, prevClose, change, percentChange }
        setStock(data);
        // console.log(stock.symbol);
      } catch (err) {
        console.log("Stock fetch error:", err);
        setError("Failed to load stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [symbol, token]);

  useEffect(() => {
    // On mount, check if stock is in watchlist
    const checkWatchlist = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/get-watchlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.log("Failed to fetch watchlist:", errorText);
          return;
        }

        const data = await res.json();
        setWatchlist(data.watchlist);

        const isWatchlisted = data.watchlist.some(
          (item) => item.symbol === symbol
        );
        setIsInWatchlist(isWatchlisted);

        console.log(isWatchlisted);
      } catch (err) {
        console.log("Error checking watchlist:", err);
      }
    };

    if (token && symbol) checkWatchlist();
  }, [token, symbol]);

  // useEffect(() => {
  //   const fetchPredictions = async () => {
  //     try {
  //       setPredictionsLoading(false);

  //       const res = await fetch(
  //         `${API_URL}/predict/${symbol}?days=15&modelType=lstm`,
  //         {
  //           method: "POST",
  //         }
  //       );
  //       const data = await res.json();

  //       setPredictions(data);
  //       // console.log("Predictions:", data);
  //     } catch (err) {
  //       console.log("Prediction fetch error:", err);
  //     } finally {
  //       setPredictionsLoading(false);
  //     }
  //   };

  //   fetchPredictions();
  // });

  // console.log(predictions);

  const predictions = [
    {
      date: "2025-12-24",
      price: 274.1451110839844,
    },
    {
      date: "2025-12-25",
      price: 273.7609558105469,
    },
    {
      date: "2025-12-26",
      price: 273.5689697265625,
    },
    {
      date: "2025-12-27",
      price: 273.494873046875,
    },
    {
      date: "2025-12-28",
      price: 273.49456787109375,
    },
    {
      date: "2025-12-29",
      price: 273.54132080078125,
    },
    {
      date: "2025-12-30",
      price: 273.6188659667969,
    },
    {
      date: "2025-12-31",
      price: 273.7171325683594,
    },
    {
      date: "2026-01-01",
      price: 273.8297424316406,
    },
    {
      date: "2026-01-02",
      price: 273.9524841308594,
    },
    {
      date: "2026-01-03",
      price: 274.0827331542969,
    },
    {
      date: "2026-01-04",
      price: 274.218505859375,
    },
    {
      date: "2026-01-05",
      price: 274.3583679199219,
    },
    {
      date: "2026-01-06",
      price: 274.5013427734375,
    },
    {
      date: "2026-01-07",
      price: 274.6465759277344,
    },
  ];

  const positive = stock?.change >= 0;

  if (loading || !stock) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loader />
      </SafeAreaView>
    );
  }

  const saveToWatchlist = async () => {
    setIsInWatchlist(!isInWatchlist);
    try {
      const res = await fetch(`${API_URL}/api/users/save-watchlist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.log("Failed to save to watchlist:", errorText);
        return;
      }

      const data = await res.json();
      // console.log("Saved:", data);
    } catch (err) {
      console.log("Network / fetch error:", err);
    }
  };

  const getPredictionText = () => {
    if (predictChange < 0) {
      return "Not recommended to buy. Expected negative return.";
    }

    if (predictChange === 0) {
      return "Uncertain outcome. Invest only if you have strong market knowledge.";
    }

    if (predictChange > 0 && predictChange <= 0.5) {
      return "Very low upside. Conservative investors should wait.";
    }

    if (predictChange > 0.5 && predictChange <= 1) {
      return "Low potential return. Suitable only for low-risk strategies.";
    }

    if (predictChange > 1 && predictChange <= 1.5) {
      return "Mild upside expected. Small gains possible.";
    }

    if (predictChange > 1.5 && predictChange <= 2) {
      return "Moderate growth potential. Entry could be considered.";
    }

    if (predictChange > 2 && predictChange <= 2.5) {
      return "Good upside. Favorable risk-to-reward ratio.";
    }

    if (predictChange > 2.5 && predictChange <= 3) {
      return "Strong growth signal. Suitable for medium-term holding.";
    }

    if (predictChange > 3 && predictChange <= 3.5) {
      return "Very strong momentum. Accumulation recommended.";
    }

    if (predictChange > 3.5 && predictChange <= 4) {
      return "High confidence buy signal. Bullish outlook.";
    }

    if (predictChange > 4 && predictChange <= 4.5) {
      return "Very bullish setup. Strong upside expected.";
    }

    if (predictChange > 4.5 && predictChange <= 5) {
      return "Excellent opportunity. High probability of strong returns.";
    }

    return "Extremely bullish. Strong buy with high return potential.";
  };

  const predictionBreakdown =
    predictions !== null && predictions.length > 0
      ? predictions?.map((prediction, index) => (
          <View style={styles.dayGridItem} key={index}>
            <Text style={styles.value}>{prediction.date}</Text>
            <Text style={styles.value}>${prediction.price.toFixed(2)}</Text>
          </View>
        ))
      : null;

  const predictChange = 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.circleBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.symbol}>{stock.symbol}</Text>
            {/* <Text style={styles.subSymbol}>NASDAQ · USD</Text> */}
          </View>

          <TouchableOpacity
            onPress={saveToWatchlist}
            style={styles.headerRight}
          >
            <Ionicons
              name={isInWatchlist ? "heart" : "heart-outline"}
              size={26}
              color="#d2d2d2ff"
              style={{
                marginRight: 12,
                borderRadius: 13,
                padding: 4,
              }}
            />
            {/* <Ionicons name="share-social-outline" size={20} color="#747474" /> */}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          {/* Price Area */}
          <View style={styles.priceArea}>
            <Text style={styles.price}>${stock.currentPrice?.toFixed(2)}</Text>

            <View
              style={[
                styles.pill,
                { backgroundColor: positive ? "#163D2B" : "#3D1B1B" },
              ]}
            >
              <Text
                style={{
                  color: positive ? "#16C784" : "#EA3943",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {positive ? "+" : ""}
                {stock.percentChange?.toFixed(2)}%
              </Text>

              {/* <Text style={styles.changeText}>
                {positive ? "+" : ""}
                {stock.change?.toFixed(2)}
              </Text> */}
            </View>
          </View>

          {/* Time Tabs */}
          <View style={styles.tabs}>
            {TIME_RANGES.map((t) => {
              const isActive = selectedRange === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedRange(t)}
                  style={styles.tabItem}
                >
                  <Text
                    style={[styles.tabText, isActive && styles.tabActiveText]}
                  >
                    {t}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chart Placeholder */}
          {/* <View style={styles.tabs}>
            {ranges.map((r) => (
              <Text
                key={r}
                onPress={() => setRange(r)}
                style={[styles.tabText, isActive && styles.tabActiveText]}
              >
                {r}
              </Text>
            ))}
          </View> */}

          <StockCandleChart
            rangeKey={selectedRange}
            chart={chart}
            loading={chartLoading}
          />

          {/* Stats Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>24h Overview</Text>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Open</Text>
                <Text style={styles.value}>${stock.open}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>High</Text>
                <Text style={styles.value}>${stock.high}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Low</Text>
                <Text style={styles.value}>${stock.low}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Prev Close</Text>
                <Text style={styles.value}>${stock.prevClose}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Change</Text>
                <Text
                  style={[
                    styles.value,
                    positive ? styles.greenText : styles.redText,
                  ]}
                >
                  {positive ? "+" : ""}
                  {stock.change}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Change %</Text>
                <Text
                  style={[
                    styles.value,
                    positive ? styles.greenText : styles.redText,
                  ]}
                >
                  {positive ? "+" : ""}
                  {stock.percentChange?.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>

          <PredictiveGraph
            loading={predictionsLoading}
            predictions={predictions}
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Expected 15 Days {symbol} Statistics
            </Text>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Currect Price</Text>
                <Text style={styles.value}>${stock.open}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>After 15 days (Expected)</Text>
                {/* <Text style={styles.value}>
                  ${predictions[0].price.toFixed(2)}
                </Text> */}
              </View>
              <View>
                <Text style={styles.label}>Percent (%)</Text>
                <Text
                  style={[
                    styles.value,
                    { color: predictChange >= 0 ? "#0DBA7D" : "#D9435E" },
                  ]}
                >
                  {predictChange.toFixed(2)}%
                </Text>
              </View>

              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="sparkles" size={15} color="#87CEEB" />
                  <Text style={styles.AIValue}>AI Suggestions:</Text>
                </View>
                <Text style={styles.value}>{getPredictionText()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>By Day Breakdown</Text>

            <View style={styles.dayGrid}>
              <View style={styles.dayGridItem}>
                <Text style={styles.dayLabel}>Date</Text>
                <Text style={styles.dayLabel}>Stock Price</Text>
              </View>

              {predictionBreakdown}
            </View>
          </View>

          {/* Action Buttons */}
          {/* <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryText}>Add to Portfolio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Predict</Text>
            </TouchableOpacity>
          </View> */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#070707",
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /** HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#101010",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  symbol: {
    color: "#e8eaed",
    fontSize: 20,
    fontWeight: "700",
  },
  subSymbol: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  /** PRICE AREA */
  priceArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingTop: 10,
  },
  price: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  pill: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  greenBg: { backgroundColor: "#0DBA7D" },
  redBg: { backgroundColor: "#D9435E" },
  changeText: {
    color: "#fff",
    marginTop: 6,
    fontSize: 14,
  },

  /** TABS */
  tabs: {
    flexDirection: "row",
    marginBottom: 14,
  },
  tabItem: {
    marginRight: 18,
    alignItems: "center",
  },
  tabText: {
    color: "#6E6E6E",
    fontSize: 14,
  },
  tabActiveText: {
    color: "#fff",
    fontWeight: "700",
  },
  tabIndicator: {
    width: 18,
    height: 2,
    backgroundColor: "#FFD700",
    marginTop: 6,
    borderRadius: 999,
  },

  /** CHART */
  chartBox: {
    height: 230,
    borderRadius: 16,
    backgroundColor: "#101014",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  chartPlaceholder: {
    color: "#555",
    fontSize: 13,
  },

  /** CARD */
  card: {
    backgroundColor: "#101014",
    padding: 18,
    borderRadius: 16,
    marginVertical: 20,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  /** GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "33.3%",
    marginBottom: 14,
  },
  dayGrid: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  dayGridItem: {
    justifyContent: "space-between",
    width: "100%",
    flexDirection: "row",
    marginBottom: 14,
  },
  label: {
    color: "#7A7A7A",
    fontSize: 12,
    marginBottom: 4,
  },
  dayLabel: {
    color: "#7A7A7A",
    fontSize: 14,
    textAlign: "center",
  },
  value: {
    color: "#dfdfdfff",
    fontSize: 15,
    fontWeight: "600",
  },
  AIValue: {
    color: "#87CEEB",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
    marginBottom: 4,
    marginTop: 15,
  },
  greenText: { color: "#0DBA7D" },
  redText: { color: "#F05555" },

  /** ACTION BUTTONS */
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#F5A623",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginRight: 10,
  },
  primaryText: {
    color: "#0D0D0D",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    borderColor: "#333",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
