import React, { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, PanResponder, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RadiusSliderProps {
  searchRadius: number;
  onRadiusChange: (low: number, high: number, fromUser: boolean) => void;
  addressesCount: number;
}

const RadiusSlider: React.FC<RadiusSliderProps> = ({
  searchRadius,
  onRadiusChange,
  addressesCount,
}) => {
  const sliderWidth = 280; // Fixed width for the slider
  const minValue = 1;
  const maxValue = 20000;

  // Use state to track the current position and display value
  const [currentPosition, setCurrentPosition] = useState(
    ((searchRadius - minValue) / (maxValue - minValue)) * sliderWidth
  );
  const [displayValue, setDisplayValue] = useState(searchRadius);

  const pan = useRef(new Animated.Value(currentPosition)).current;

  // Calculate the position based on current radius
  const getPositionFromValue = useCallback((value: number) => {
    return ((value - minValue) / (maxValue - minValue)) * sliderWidth;
  }, []);

  const getValueFromPosition = useCallback((position: number) => {
    const ratio = Math.max(0, Math.min(1, position / sliderWidth));
    return Math.round(minValue + ratio * (maxValue - minValue));
  }, []);

  // Update position when searchRadius changes externally
  React.useEffect(() => {
    const newPosition = getPositionFromValue(searchRadius);
    setCurrentPosition(newPosition);
    setDisplayValue(searchRadius);
    Animated.timing(pan, {
      toValue: newPosition,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [searchRadius, pan, getPositionFromValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start from current position
        pan.setValue(currentPosition);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(sliderWidth, currentPosition + gestureState.dx)
        );
        pan.setValue(newPosition);

        // Update display value in real-time
        const newValue = getValueFromPosition(newPosition);
        setDisplayValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalPosition = Math.max(
          0,
          Math.min(sliderWidth, currentPosition + gestureState.dx)
        );
        const newValue = getValueFromPosition(finalPosition);

        setCurrentPosition(finalPosition);

        if (newValue !== searchRadius) {
          onRadiusChange(newValue, 0, true);
        }
      },
    })
  ).current;

  return (
    <View style={styles.radiusContainer}>
      <View style={styles.radiusHeader}>
        <Ionicons name="location" size={16} color="#2ecc71" />
        <Text style={styles.radiusLabel}>Rayon de recherche</Text>
        <Text style={styles.radiusValue}>{displayValue} km</Text>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Animated.View
            style={[
              styles.sliderTrackActive,
              {
                width: pan.interpolate({
                  inputRange: [0, sliderWidth],
                  outputRange: [0, sliderWidth],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                transform: [
                  {
                    translateX: pan.interpolate({
                      inputRange: [0, sliderWidth],
                      outputRange: [-10, sliderWidth - 10],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          />
        </View>
      </View>
      <View style={styles.radiusRange}>
        <Text style={styles.rangeText}>1 km</Text>
        <Text style={styles.rangeText}>20,000 km</Text>
      </View>
      <Text style={styles.rangeText}>Adresses trouvées: {addressesCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  radiusContainer: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  radiusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2ecc71",
  },
  sliderContainer: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderTrack: {
    width: 280,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    position: "relative",
  },
  sliderTrackActive: {
    height: 4,
    backgroundColor: "#2ecc71",
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: "#2ecc71",
    borderRadius: 10,
    position: "absolute",
    top: -8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  radiusRange: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeText: {
    fontSize: 12,
    color: "#666",
  },
});

export default RadiusSlider;
