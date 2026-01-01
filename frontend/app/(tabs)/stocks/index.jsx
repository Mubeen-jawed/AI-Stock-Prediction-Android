import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import SegmentTabs from "../../../components/SegmentTabs";
import StockRow from "../../../components/StockRow";
import { fetchStocks } from "../../../data/stocks";
import { useAuth } from "../../../context/AuthContext";
import SkeletonLoader from "../../../components/SkeletonLoader";

const TOP_TABS = ["All", "Hot", "Gainers", "Losers"];
// Bybit shows: Spot / Derivatives / TradFi. For stocks we map close to that:

export default function StocksScreen() {
  const [topTab, setTopTab] = useState("Favorites");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();

  async function load() {
    setLoading(true);
    const data = await fetchStocks({ topTab, q, token });
    setRows(data);
    setLoading(false);
  }

  // useEffect(() => {
  //   fetchStocks({ topTab, subTab, q, token });
  //   console.log(token);
  // }, [topTab, subTab, q, token]);

  useEffect(() => {
    load();
  }, [topTab, q, token]);

  return (
    <View style={styles.screen}>
      {/* Search bar + icons */}
      <View style={styles.header}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color="#9aa0a6" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search AAPL/TSLA"
            placeholderTextColor="#9aa0a6"
            style={styles.input}
          />
        </View>
      </View>

      {/* Top tabs (Favorites | Hot | …) */}
      {/* <SegmentTabs tabs={TOP_TABS} active={topTab} onChange={setTopTab} /> */}

      {/* Sub tabs row (Spot | ETFs | Indices | TradFi) */}

      {/* Table header (Bybit style labels) */}
      <View style={styles.headRow}>
        <Text style={[styles.hcell, { flex: 1.3 }]}>Trading Pairs / Vol •</Text>
        <Text style={[styles.hcell, { flex: 1 }]}>Price •</Text>
        <Text style={[styles.hcell, { width: 100, textAlign: "right" }]}>
          24H Change •
        </Text>
      </View>

      <ScrollView
        style={styles.listCard}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {loading ? (
          <SkeletonLoader />
        ) : (
          rows
            .filter(
              (s) =>
                s.name &&
                s.logo &&
                s.symbol &&
                typeof s.price === "number" &&
                s.changePercent !== undefined
            )
            .map((s) => (
              <StockRow
                key={s.symbol}
                logo={s.logo}
                name={s.name}
                ticker={s.symbol}
                price={s.price.toLocaleString()}
                changePercent={s.changePercent}
              />
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 36,
  },
  input: { flex: 1, color: "#fff", marginLeft: 6 },
  headRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 14 },
  hcell: { color: "#9aa0a6", fontSize: 12 },
  listCard: { backgroundColor: "transparent", marginTop: 4 },
  loading: { color: "#e8eaed", paddingHorizontal: 16, paddingVertical: 20 },
});
