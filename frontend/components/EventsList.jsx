import { StyleSheet, Text, View } from "react-native";

export default function EventsList({ items }) {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.title}>Latest Events</Text>
        <Text style={styles.muted}> News</Text>
      </View>
      {items.map((e) => (
        <View key={e.title} style={{ marginTop: 12 }}>
          <Text style={styles.item}>{e.title}</Text>
          <Text style={styles.date}>{e.date}</Text>
        </View>
      ))}
      <Text style={styles.more}>More →</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginTop: 20,
  },
  title: { color: "#e8eaed", fontWeight: "800" },
  muted: { color: "#9aa0a6", fontWeight: "700" },
  item: { color: "#e8eaed" },
  date: { color: "#9aa0a6", fontSize: 12, marginTop: 2 },
  more: { color: "#e8eaed", opacity: 0.9, alignSelf: "center", marginTop: 14 },
});
