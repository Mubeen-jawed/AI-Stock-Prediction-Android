import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { API_URL } from "../../config/config";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  // const [profile, setProfile] = useState({});
  const { token, logout } = useAuth();

  const { user } = useAuth();

  console.log(user);

  if (!user) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <StatusBar style="light" />
        <Text style={{ color: "#e8eaed" }}>Loading profile…</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await fetch(`${API_URL}/api/users/logout`, {
        method: "POST",
        headers,
      });
    } finally {
      await logout();
      router.replace("/login");
    }
  };

  // console.log(profile?.user, "profile");

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${
                user?.name || "User"
              }&background=ffffff&color=000000&rounded=true&size=128`,
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {user?.email ? user.email : "loading"}{" "}
            </Text>
            {/* <Text style={styles.uid}>
              {profile?.user?.name ? profile.user.name : "loading"}
            </Text> */}
            <Text style={styles.uid}>
              UID: {user?.id ? user.id : "loading"}
            </Text>

            {/* <Text style={styles.uid}>{profile.region}</Text> */}
          </View>
        </View>

        {/* Status pills */}
        {/* <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="shield-outline" size={14} color="#e8eaed" />
            <Text style={styles.badgeText}>
              {profile.verified ? "Verified" : "Unverified"}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#262626" }]}>
            <Text style={styles.badgeText}>{profile.tier}</Text>
          </View>
        </View> */}

        {/* Verification card */}

        {/* Two feature cards */}
        <View style={styles.featureRow}>
          <TouchableOpacity
            onPress={() => router.push("/portfolio")}
            style={styles.featureCard}
          >
            <Ionicons name="wallet-outline" size={22} color="#e8eaed" />
            <Text style={styles.featureTitle}>Your Portfolio</Text>
            <Text style={styles.featureSub}>Check Now</Text>
          </TouchableOpacity>
          <View style={styles.featureCard}>
            <Ionicons name="heart-outline" size={22} color="#e8eaed" />
            <Text style={styles.featureTitle}>Watchlist</Text>
            <Text style={styles.featureSub}>Check Now</Text>
          </View>
        </View>

        {/* Recently used */}

        {/* Footer */}
        <View style={styles.footer}>
          {/* <Text style={styles.footerText}>
            <Ionicons name="settings-outline" size={15} color="#e8eaed" />
            <Text style={styles.settingText}>Setting</Text>
          </Text> */}
          {/* <View style={styles.footerDivider} /> */}
          <Text>
            {" "}
            <Ionicons color="#f75858ff" name="log-out-outline" size={20} />
          </Text>
          <Text onPress={handleLogout} style={styles.footerText}>
            Logout
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 80 },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 14,
    alignItems: "center",
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  name: { color: "#e8eaed", fontSize: 18, fontWeight: "700" },
  uid: { color: "#9aa0a6", fontSize: 11, marginTop: 2 },

  badgeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: { color: "#e8eaed", fontSize: 12, marginLeft: 4 },

  verifyCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  verifyTitle: { color: "#e8eaed", fontSize: 14, fontWeight: "600" },
  verifyBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 10,
  },
  verifyBtnText: {
    color: "#141414",
    fontWeight: "700",
    fontSize: 13,
  },

  featureRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 14,
    marginRight: 8,
  },
  featureTitle: {
    color: "#e8eaed",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
  },
  featureSub: { color: "#9aa0a6", fontSize: 12, marginTop: 2 },

  sectionLabel: {
    color: "#9aa0a6",
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 22,
  },
  recentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  recentItem: { alignItems: "center", marginRight: 28 },
  recentText: {
    color: "#e8eaed",
    fontSize: 12,
    marginTop: 6,
  },

  allBtn: {
    alignSelf: "center",
    marginTop: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e8eaed",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  allBtnText: { color: "#e8eaed", fontWeight: "700" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    gap: 3,
  },
  footerText: {
    color: "#f75858ff",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    // gapHorizontal: 4,
  },

  settingText: {
    marginLeft: 50,
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#555",
    marginHorizontal: 14,
  },
});
