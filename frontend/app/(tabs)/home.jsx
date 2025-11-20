import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ActionRow from "../../components/ActionRow";
import EventsList from "../../components/EventsList";
import HomeHeader from "../../components/HomeHeader";
import PromoCard from "../../components/PromoCard";
import SegmentTabs from "../../components/SegmentTabs";
import StockRow from "../../components/StockRow";

import { useAuth } from "../../context/AuthContext";

const GAINERS = [
  {
    logo: "https://logo.clearbit.com/apple.com",
    name: "Apple",
    ticker: "AAPL",
    price: "228.54",
    changePercent: 2.31,
    vol: "24.8B",
  },
  {
    logo: "https://logo.clearbit.com/nvidia.com",
    name: "NVIDIA",
    ticker: "NVDA",
    price: "123.91",
    changePercent: 1.12,
    vol: "18.3B",
  },
  {
    logo: "https://logo.clearbit.com/tesla.com",
    name: "Tesla",
    ticker: "TSLA",
    price: "254.02",
    changePercent: 3.1,
    vol: "12.4B",
  },
  {
    logo: "https://logo.clearbit.com/microsoft.com",
    name: "Microsoft",
    ticker: "MSFT",
    price: "425.77",
    changePercent: 0.48,
    vol: "9.7B",
  },
];

export default function Home() {
  const [topTab, setTopTab] = useState("Watchlist");
  const [subTab, setSubTab] = useState("Spot");

  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <HomeHeader user={user} />

        {/* Onboarding banner (Bybit "Verify Now" → Stock KYC) */}
        {/* <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Verify your identity to start trading.
          </Text>
          <Text style={styles.bannerCta}>Verify Now</Text>
        </View> */}

        <ActionRow />

        <Text style={styles.welcomeText}>
          Welcome back,
          <Text style={styles.userName}> {user?.name || "Guest"} </Text>
        </Text>

        <PromoCard title="Deposit $100 and get $20 bonus" />

        {/* Two promo chips row */}
        {/* <View style={styles.cardRow}>
          <View style={styles.smallCard}>
            <Text style={styles.smallTitle}>Referral Bonus</Text>
            <Text style={styles.smallSub}>Earn $50 per friend</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.smallTitle}>IPO Watch</Text>
            <Text style={styles.smallSub}>New listings this week</Text>
          </View>
        </View> */}

        {/* Tabs like Bybit (top + sub) */}
        <SegmentTabs
          tabs={["Watchlist", "Top", "New", "Gainers", "Losers", "Volume"]}
          active={topTab}
          onChange={setTopTab}
        />

        {/* Stock list (gainers sample) */}
        <View style={styles.listCard}>
          {GAINERS.map((s) => (
            <StockRow key={s.ticker} {...s} />
          ))}
          <Text onPress={() => router.push("/stocks")} style={styles.more}>
            More <Ionicons name="chevron-forward" size={12} color="#e8eaed" />
          </Text>
        </View>

        <EventsList
          items={[
            { title: "Black Friday: Commission rebate", date: "Nov 25, 2025" },
            { title: "New ETFs added: AI/Robotics", date: "Nov 21, 2025" },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 40 },
  banner: {
    backgroundColor: "#141414",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  welcomeText: {
    color: "#e8eaed",
    fontSize: 22,
    fontWeight: "600",
    paddingHorizontal: 24,
    paddingVertical: 15,
    letterSpacing: 0.5,
  },

  userName: {
    color: "#FFD700", // Bybit accent color
    fontWeight: "700",
    fontSize: 24,
  },

  bannerTitle: {
    color: "#e8eaed",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  bannerCta: {
    backgroundColor: "#FFB000",
    alignSelf: "flex-start",
    color: "#141414",
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cardRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 14,
    padding: 14,
  },
  smallTitle: { color: "#e8eaed", fontWeight: "700" },
  smallSub: { color: "#9aa0a6", marginTop: 6 },
  listCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 4,
  },
  more: { color: "#e8eaed", alignSelf: "center", marginVertical: 12 },
});
