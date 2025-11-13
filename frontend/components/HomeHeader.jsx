import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeHeader() {
  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: "https://i.pravatar.cc/64" }}
        style={styles.avatar}
      />
      <View style={styles.search}>
        <Ionicons name="search" size={18} color="#9aa0a6" />
        <TextInput
          placeholder="Search AAPL/TSLA"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
        />
      </View>
      <TouchableOpacity style={styles.icon}>
        <Ionicons name="scan-outline" size={22} color="#e8eaed" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.icon}>
        <Ionicons name="notifications-outline" size={22} color="#e8eaed" />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "#0D0D0D",
  },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
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
  icon: { marginLeft: 10 },
});
