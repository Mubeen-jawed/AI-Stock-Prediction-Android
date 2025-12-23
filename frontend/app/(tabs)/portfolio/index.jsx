import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
// import { LinearGradient } from "expo-linear-gradient";

import PortfolioSummaryCard from "../../../components/PortfolioSummaryCard";
import PositionRow from "../../../components/PositionRow";
import SkeletonLoader from "../../../components/SkeletonLoader";
import { fetchPortfolio } from "../../../data/portfolio";
import { useAuth } from "../../../context/AuthContext";

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  async function load() {
    try {
      setLoading(true);
      const data = await fetchPortfolio(token);
      setPortfolio(data);
    } finally {
      setLoading(false);
    }
  }
  // console.log(portfolio.distribution.length);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [token])
  );

  function getColorFromSymbol(symbol) {
    let hash = 0;

    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).slice(-2);
    }

    return color;
  }

  const pieData = (portfolio?.distribution ?? []).map((d) => ({
    value: d.value,
    color: getColorFromSymbol(d.symbol),
    text: d.symbol,
  }));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>Portfolio</Text>

        {loading || !portfolio ? (
          <SkeletonLoader />
        ) : (
          <>
            {/* Summary card */}
            <PortfolioSummaryCard summary={portfolio.summary} />

            {/* Pie chart section (placeholder for real chart lib) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Asset Allocation</Text>
              <Text style={styles.cardSub}>Distribution by current value</Text>
              <View style={styles.pieWrap}>
                {portfolio?.distribution?.length > 0 && (
                  <PieChart
                    data={pieData}
                    radius={60}
                    innerRadius={40}
                    donut
                    showText={false}
                  />
                )}

                <View style={{ marginLeft: 16, flex: 1 }}>
                  {portfolio.distribution.map((d) => (
                    <View
                      key={d.symbol}
                      style={{ flexDirection: "row", marginBottom: 6 }}
                    >
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: getColorFromSymbol(d.symbol) },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {d.symbol} • ${d.value.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* AI predictions card (fake line chart box for now) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AI Predictions</Text>
              <Text style={styles.cardSub}>
                Expected growth over the next 30 days
              </Text>
              <View style={styles.chartBox} />
              <Text style={styles.hint}>
                Replace this box with a real line chart (e.g. Reanimated /
                Victory) when backend data is wired.
              </Text>
            </View>

            {/* Positions list */}
            <View style={[styles.card, { paddingHorizontal: 0 }]}>
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={styles.cardTitle}>Holdings</Text>
                <Text style={styles.cardSub}>
                  Quantity, average buy price, and performance
                </Text>
              </View>

              {portfolio.positions.map((pos) => (
                <PositionRow key={pos.symbol} pos={pos} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed Add Stock button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/portfolio/add-stock")} // page to build next
      >
        <Ionicons name="add" size={22} color="#141414" />
        <Text style={styles.fabText}>Add Portfolio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 40 },
  title: {
    color: "#e8eaed",
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loading: { color: "#e8eaed", paddingHorizontal: 16, marginTop: 16 },
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  cardTitle: { color: "#e8eaed", fontWeight: "700", fontSize: 15 },
  cardSub: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },
  pieWrap: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  pieCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1F1F1F",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
    marginTop: 4,
    marginRight: 6,
  },
  legendText: { color: "#e8eaed", fontSize: 12 },
  chartBox: {
    marginTop: 16,
    height: 140,
    borderRadius: 10,
    backgroundColor: "#1F1F1F",
  },
  hint: { color: "#9aa0a6", fontSize: 11, marginTop: 8 },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 20, // above tab bar
    backgroundColor: "#FFD700",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  fabText: {
    color: "#141414",
    fontWeight: "700",
    marginLeft: 6,
  },
});
