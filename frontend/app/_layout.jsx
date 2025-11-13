import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: "#1A1A1A",
          height: 70,
          // borderRadius: 20,
          marginBottom: 25,
        },
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#888",
        tabBarIcon: ({ color, size }) => {
          const icons = {
            index: "home-outline",
            stocks: "stats-chart-outline",
            portfolio: "wallet-outline",
            news: "newspaper-outline",
            profile: "person-outline",
          };
          return <Ionicons name={icons[route.name]} color={color} size={22} />;
        },
      })}
    />
  );
}
