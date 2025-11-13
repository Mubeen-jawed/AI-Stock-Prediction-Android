import { Image, StyleSheet, Text, View } from "react-native";

export default function StockRow({ logo, name, ticker, price, pct, vol }) {
  const up = pct >= 0;
  return (
    <View style={styles.row}>
      <Image source={{ uri: logo }} style={styles.logo} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {name} <Text style={styles.ticker}>/ USD</Text>
        </Text>
        <Text style={styles.vol}>{vol} USD</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.price}>{price}</Text>
        <View
          style={[styles.pill, { backgroundColor: up ? "#163D2B" : "#3D1B1B" }]}
        >
          <Text
            style={{ color: up ? "#16C784" : "#EA3943", fontWeight: "700" }}
          >
            {up ? "+" : ""}
            {pct.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logo: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  name: { color: "#e8eaed", fontWeight: "700" },
  ticker: { color: "#9aa0a6", fontWeight: "400" },
  vol: { color: "#9aa0a6", fontSize: 12, marginTop: 2 },
  price: { color: "#e8eaed", fontWeight: "700" },
  pill: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
