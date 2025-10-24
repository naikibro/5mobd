import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, PanResponder, Animated } from "react-native";

interface RadiusSliderProps {
  initialValue: number;
  onValueChange: (value: number) => void;
  addressesCount: number;
}

const RadiusSlider: React.FC<RadiusSliderProps> = ({
  initialValue,
  onValueChange,
  addressesCount,
}) => {
  const minValue = 1;
  const maxValue = 20000;
  const sliderWidth = 280;

  const [sliderValue, setSliderValue] = useState(initialValue);
  const pan = useRef(
    new Animated.Value(
      ((initialValue - minValue) / (maxValue - minValue)) * sliderWidth
    )
  ).current;

  const getValueFromPosition = (position: number) => {
    const ratio = Math.max(0, Math.min(1, position / sliderWidth));
    return Math.round(minValue + ratio * (maxValue - minValue));
  };

  const updateSlider = (position: number) => {
    const newValue = getValueFromPosition(position);
    pan.setValue(position);
    setSliderValue(newValue);
    onValueChange(newValue);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newPosition = Math.max(0, Math.min(sliderWidth, touchX));
        updateSlider(newPosition);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newPosition = Math.max(0, Math.min(sliderWidth, touchX));
        updateSlider(newPosition);
      },
      onPanResponderRelease: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const newPosition = Math.max(0, Math.min(sliderWidth, touchX));
        updateSlider(newPosition);
      },
    })
  ).current;

  return (
    <View style={styles.radiusContainer}>
      <View style={styles.radiusHeader}>
        <Ionicons name="location" size={16} color="#2ecc71" />
        <Text style={styles.radiusLabel}>Rayon de recherche</Text>
        <Text style={styles.radiusValue}>{sliderValue} km</Text>
      </View>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack} {...panResponder.panHandlers}>
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
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderTrack: {
    width: 280,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    position: "relative",
  },
  sliderTrackActive: {
    height: 8,
    backgroundColor: "#2ecc71",
    borderRadius: 4,
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
    top: -6,
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
