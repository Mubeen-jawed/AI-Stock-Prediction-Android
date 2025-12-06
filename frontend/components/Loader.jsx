import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function CandlesLoader() {
  const c1 = useRef(new Animated.Value(1)).current;
  const c2 = useRef(new Animated.Value(1)).current;
  const c3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = (val, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1.4,
            duration: 500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(c1, 0);
    animate(c2, 150);
    animate(c3, 300);
  }, [c1, c2, c3]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Animated.View
          style={[styles.candle, { transform: [{ scaleY: c1 }] }]}
        />
        <Animated.View
          style={[styles.candle, { transform: [{ scaleY: c2 }] }]}
        />
        <Animated.View
          style={[styles.candle, { transform: [{ scaleY: c3 }] }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: "#050507",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  candle: {
    width: 8,
    height: 32,
    borderRadius: 6,
    marginHorizontal: 5,
    backgroundColor: "#FFD700", // Bybit yellow
  },
});
