import { StyleSheet, Text, View } from "react-native";
export default function PromoCard({ title, sub }) {
  return (
    <View style={styles.card}>
      <Text style={styles.tag}>Events</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.link}>Explore Now →</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  tag: { color: "#9aa0a6", marginBottom: 8 },
  title: { color: "#e8eaed", fontWeight: "700", fontSize: 16 },
  link: { color: "#FFD700", marginTop: 8 },
});
