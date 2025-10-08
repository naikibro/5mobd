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

interface PhotoGalleryProps {
  photos: string[];
  isLoading?: boolean;
  error?: boolean;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  isLoading = false,
  error = false,
}) => {
  const [imageDimensions, setImageDimensions] = useState<{
    [key: string]: { width: number; height: number };
  }>({});

  // Handle loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2ecc71" />
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
    return (
      <View style={styles.noPhotosContainer}>
        <Ionicons name="image-outline" size={24} color="#bdc3c7" />
      </View>
    );
  }

  // Handle single photo
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
                (width > 768 ? (width - 32) * 0.48 : width - 32) *
                  (dimensions.height / dimensions.width),
                300
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
    const itemWidth = (width > 768 ? (width - 32) * 0.48 : width - 32) / 2 - 4;

    return (
      <View style={[{ width: itemWidth }]}>
        <Image
          source={{ uri: item }}
          style={[
            styles.multiplePhoto,
            dimensions && {
              height: Math.min(
                itemWidth * (dimensions.height / dimensions.width),
                200
              ),
            },
          ]}
          resizeMode="cover"
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
      />
      <View style={styles.photoCountOverlay}>
        <Ionicons name="images" size={16} color="#fff" />
        <Text style={styles.photoCountText}>{photos.length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 120,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  noPhotosContainer: {
    height: 120,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  singlePhotoContainer: {
    width: "100%",
  },
  singlePhoto: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 120,
    maxHeight: 300,
  },
  multiplePhotosContainer: {
    position: "relative",
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
  },
  multiplePhoto: {
    width: "100%",
    minHeight: 112,
    maxHeight: 200,
  },
  photoCountOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
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
});

export default PhotoGallery;
