import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import NewsCard from "../components/NewsCard";
import { fetchNews } from "../data/news";

const TABS = ["Latest Events"];

export default function NewsScreen() {
  const [activeTab, setActiveTab] = useState("Latest Activities");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const data = await fetchNews({ tab: activeTab });
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [activeTab]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>News</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NEWS LIST */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {loading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          items.map((item) => <NewsCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 40 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#e8eaed", fontSize: 20, fontWeight: "700" },

  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  tabButton: {
    marginRight: 20,
    alignItems: "center",
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: { color: "#fff" },
  tabIndicator: {
    height: 2,
    width: "100%",
    backgroundColor: "#fff",
    marginTop: 6,
    borderRadius: 10,
  },

  list: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  loading: { color: "#e8eaed", fontSize: 14, paddingTop: 20 },
});
