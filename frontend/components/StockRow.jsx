import { Image, TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function StockRow({
  logo,
  name,
  price,
  changePercent,
  ticker,
  open,
  high,
  low,
  volume,
}) {
  const up = changePercent >= 0;
  const router = useRouter();

  console.log(`https://img.logo.dev/${logo}`, "logo uri");

  return (
    <TouchableOpacity
      onPress={() => {
        router.push(`/stocks/${ticker}`);
        console.log(ticker, "ticker");
      }}
      key={name}
      style={styles.row}
    >
      <Image
        source={{
          uri: `https://img.logo.dev/${logo}?token=pk_P253PcFaTZepqM7o3SqeWw`,
        }}
        style={styles.logo}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {ticker} <Text style={styles.ticker}></Text>
        </Text>
        <Text style={styles.vol}>{name}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.price}>${price}</Text>
        {changePercent === null ||
        changePercent === undefined ||
        changePercent == 0 ? null : (
          <View
            style={[
              styles.pill,
              { backgroundColor: up ? "#163D2B" : "#3D1B1B" },
            ]}
          >
            <Text
              style={{
                color: changePercent >= 0 ? "#16C784" : "#EA3943",
                fontWeight: "700",
                fontSize: 10,
              }}
            >
              {changePercent >= 0 ? "+" : ""}
              {changePercent?.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    fontSize: 12,
  },
});
