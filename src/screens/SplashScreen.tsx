import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Easing, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SplashScreenProps {
  onFinish: () => void;
}

// Animated component that works on all platforms
function AnimatedSplash() {
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulsing animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, [rotateAnim, scaleAnim, fadeAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
      <Animated.View
        style={{
          transform: [{ rotate: spin }, { scale: scaleAnim }],
        }}
      >
        <Ionicons name="cart" size={80} color="#2ecc71" />
      </Animated.View>
      <Text style={styles.appName}>5MOBD</Text>
      <Text style={styles.subtitle}>Votre liste de courses</Text>
    </Animated.View>
  );
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Auto-finish splash screen after animation
    const timeout = setTimeout(() => {
      onFinish();
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <AnimatedSplash />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2ecc71",
    marginTop: 24,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
});
