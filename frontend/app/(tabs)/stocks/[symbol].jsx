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
import { API_URL } from "../../../config/config";
import Loader from "../../../components/Loader";
import StockCandleChart from "../../../components/StockCandleChart";

const TIME_RANGES = ["1D", "5D", "1M", "6M", "1Y", "ALL"];

export default function StockDetailScreen({ navigation }) {
  const router = useRouter();
  const { symbol } = useLocalSearchParams();
  const { token } = useAuth();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState("1D");

  const [chart, setChart] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

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

  const positive = stock?.change >= 0;

  if (loading || !stock) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loader />
      </SafeAreaView>
    );
  }

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

          <View style={styles.headerRight}>
            <Ionicons
              name="star-outline"
              size={20}
              color="#747474"
              style={{ marginRight: 18 }}
            />
            {/* <Ionicons name="share-social-outline" size={20} color="#747474" /> */}
          </View>
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

          <StockCandleChart chart={chart} loading={chartLoading} />

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
    color: "#fff",
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
    backgroundColor: "#F5A623",
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
    marginBottom: 20,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },

  /** GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "50%",
    marginBottom: 14,
  },
  label: {
    color: "#7A7A7A",
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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
