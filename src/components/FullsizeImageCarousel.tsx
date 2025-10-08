import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface FullsizeImageCarouselProps {
  photos: string[];
  isLoading?: boolean;
  error?: boolean;
}

const FullsizeImageCarousel: React.FC<FullsizeImageCarouselProps> = ({
  photos,
  isLoading = false,
  error = false,
}) => {
  const [imageDimensions, setImageDimensions] = useState<{
    [key: string]: { width: number; height: number };
  }>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement des photos...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return null;
  }

  // Handle no photos
  if (!photos || photos.length === 0) {
    return null;
  }

  // Handle single photo - full width with aspect ratio preservation
  if (photos.length === 1) {
    const photoUrl = photos[0];
    const dimensions = imageDimensions[photoUrl];

    return (
      <View style={styles.singlePhotoContainer}>
        <Image
          source={{ uri: photoUrl }}
          style={[
            styles.singlePhoto,
            dimensions && {
              height: Math.min(
                (width - 32) * (dimensions.height / dimensions.width),
                400
              ),
            },
          ]}
          resizeMode="cover"
          onLoad={(event) => {
            const { width: imageWidth, height: imageHeight } =
              event.nativeEvent.source;
            if (!imageDimensions[photoUrl]) {
              setImageDimensions((prev) => ({
                ...prev,
                [photoUrl]: { width: imageWidth, height: imageHeight },
              }));
            }
          }}
        />
      </View>
    );
  }

  // Handle multiple photos - horizontal scroll with 2 per row
  const renderPhotoItem = ({ item }: { item: string }) => {
    const dimensions = imageDimensions[item];
    const itemWidth = width;

    return (
      <View style={[{ width: itemWidth }]}>
        <Image
          source={{ uri: item }}
          style={[
            styles.multiplePhoto,
            dimensions && {
              height: Math.min(
                itemWidth * (dimensions.height / dimensions.width),
                500
              ),
            },
          ]}
          resizeMode="contain"
          onLoad={(event) => {
            const { width: imageWidth, height: imageHeight } =
              event.nativeEvent.source;
            if (!imageDimensions[item]) {
              setImageDimensions((prev) => ({
                ...prev,
                [item]: { width: imageWidth, height: imageHeight },
              }));
            }
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.multiplePhotosContainer}>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      <View style={styles.photoCountOverlay}>
        <Ionicons name="images" size={16} color="#fff" />
        <Text style={styles.photoCountText}>{photos.length}</Text>
      </View>
      <View style={styles.dotsContainer}>
        {photos.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 200,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  singlePhotoContainer: {
    width: "100%",
    overflow: "hidden",
    marginBottom: 16,
  },
  singlePhoto: {
    width: "100%",
    minHeight: 250,
    maxHeight: 400,
  },
  multiplePhotosContainer: {
    position: "relative",
    overflow: "hidden",
    marginBottom: 16,
    height: 250,
  },
  multiplePhoto: {
    width: "100%",
    minHeight: 250,
  },
  photoCountOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  photoCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  activeDot: {
    backgroundColor: "#2ecc71",
  },
});

export default FullsizeImageCarousel;
