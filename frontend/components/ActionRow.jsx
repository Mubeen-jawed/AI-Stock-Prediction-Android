import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const items = [
  // { icon: "card-outline", label: "Add Funds" },
  {
    icon: "add-circle-outline",
    label: "Add Stock",
    route: "/portfolio/add-stock",
  },
  { icon: "gift-outline", label: "Watchlist", route: "/stockPage" },
  { icon: "ellipsis-horizontal-circle-outline", label: "More", route: "/more" },
];

export default function ActionRow() {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {items.map((i) => (
        <TouchableOpacity
          onPress={() => router.push(i.route)} // page to build next
          key={i.label}
          style={styles.item}
        >
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
    justifyContent: "space-around",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  item: { alignItems: "center" },
  txt: { color: "#e8eaed", marginTop: 6, fontSize: 12 },
});
