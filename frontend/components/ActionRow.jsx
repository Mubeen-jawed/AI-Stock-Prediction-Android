import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const items = [
  { icon: "card-outline", label: "Add Funds" },
  { icon: "add-circle-outline", label: "Add Stock" },
  { icon: "gift-outline", label: "Rewards" },
  { icon: "ellipsis-horizontal-circle-outline", label: "More" },
];

export default function ActionRow() {
  return (
    <View style={styles.row}>
      {items.map((i) => (
        <TouchableOpacity key={i.label} style={styles.item}>
          <Ionicons name={i.icon} size={22} color="#e8eaed" />
          <Text style={styles.txt}>{i.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  item: { alignItems: "center" },
  txt: { color: "#e8eaed", marginTop: 6, fontSize: 12 },
});
