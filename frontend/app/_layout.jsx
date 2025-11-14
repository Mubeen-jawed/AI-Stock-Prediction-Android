import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "#000" },
          tabBarStyle: {
            backgroundColor: "#0D0D0D",
            borderTopColor: "#1A1A1A",
            height: 70,
            marginBottom: 25,
          },
          tabBarActiveTintColor: "#FFD700",
          tabBarInactiveTintColor: "#888",
        }}
      >
        {/* HOME */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            href: "/home", // file you want to load for this tab
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={22} color={color} />
            ),
          }}
        />

        {/* MARKETS / STOCKS */}
        <Tabs.Screen
          name="stocks"
          options={{
            title: "Stocks",
            href: "/stocks", // page to load
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart-outline" size={22} color={color} />
            ),
          }}
        />

        {/* PORTFOLIO */}
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
            href: "/portfolio",
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet-outline" size={22} color={color} />
            ),
          }}
        />

        {/* NEWS */}
        <Tabs.Screen
          name="news"
          options={{
            title: "News",
            href: "/news",
            tabBarIcon: ({ color }) => (
              <Ionicons name="newspaper-outline" size={22} color={color} />
            ),
          }}
        />

        {/* PROFILE */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            href: "/profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
          }}
        />

        {/* HIDDEN PAGE - Add Stock */}
        <Tabs.Screen
          name="add-stock"
          options={{
            href: null, // hides from nav bar
          }}
        />
      </Tabs>
    </View>
  );
}
