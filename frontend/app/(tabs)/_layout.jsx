import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: "#05060A" }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: "#1A1A1A",
          height: 100,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#888",

        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "#05060A" }} />
        ),
      }}
      safeAreaInsets={{ bottom: 0 }}
    >
      <Tabs.Screen
        name="home"
        onPress={() => {
          router.push("/home");
        }}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        onPress={() => {
          router.push("/stocks");
        }}
        name="stocks"
        options={{
          title: "Stocks",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        onPress={() => {
          router.push("/portfolio");
        }}
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        onPress={() => {
          router.push("/news");
        }}
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color }) => (
            <Ionicons name="newspaper-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        onPress={() => {
          router.push("/profile");
        }}
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          href: null, // hidden
        }}
      />

      <Tabs.Screen
        name="watchlist"
        options={{
          href: null, // hidden
        }}
      />

      {/* <Tabs.Screen
        name="portfolio/add-stock"
        options={{
          href: null, // hidden
        }}
      />

      <Tabs.Screen
        name="stocks/[ticker]"
        options={{
          href: null, // hidden
        }}
      />

      <Tabs.Screen
        name="news/[id]"
        options={{
          href: null, // hidden
        }}
      /> */}
    </Tabs>
  );
}
