import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

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
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
  };

  const FullscreenImage = ({ imageUrl }: { imageUrl: string }) => {
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [lastScale, setLastScale] = useState(1);
    const [lastTranslateX, setLastTranslateX] = useState(0);
    const [lastTranslateY, setLastTranslateY] = useState(0);
    const [initialDistance, setInitialDistance] = useState(0);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setLastScale(scale);
          setLastTranslateX(translateX);
          setLastTranslateY(translateY);

          // Set initial distance for pinch gesture
          if (evt.nativeEvent.touches.length === 2) {
            const touch1 = evt.nativeEvent.touches[0];
            const touch2 = evt.nativeEvent.touches[1];
            const distance = Math.sqrt(
              Math.pow(touch2.pageX - touch1.pageX, 2) +
                Math.pow(touch2.pageY - touch1.pageY, 2)
            );
            setInitialDistance(distance);
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          // Handle pinch gesture (two fingers)
          if (evt.nativeEvent.touches.length === 2 && initialDistance > 0) {
            const touch1 = evt.nativeEvent.touches[0];
            const touch2 = evt.nativeEvent.touches[1];
            const currentDistance = Math.sqrt(
              Math.pow(touch2.pageX - touch1.pageX, 2) +
                Math.pow(touch2.pageY - touch1.pageY, 2)
            );
            const scaleFactor = currentDistance / initialDistance;
            const newScale = Math.max(
              0.5,
              Math.min(3, lastScale * scaleFactor)
            );
            setScale(newScale);
          } else if (evt.nativeEvent.touches.length === 1 && scale > 1) {
            // Handle pan gesture only when zoomed in
            setTranslateX(lastTranslateX + gestureState.dx);
            setTranslateY(lastTranslateY + gestureState.dy);
          }
        },
        onPanResponderRelease: () => {
          setLastScale(scale);
          setLastTranslateX(translateX);
          setLastTranslateY(translateY);
          setInitialDistance(0);
        },
      })
    ).current;

    const resetImage = () => {
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
      setLastScale(1);
      setLastTranslateX(0);
      setLastTranslateY(0);
      setInitialDistance(0);
    };

    return (
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.fullscreenBackground}
          activeOpacity={1}
          onPress={closeFullscreen}
        >
          <View style={styles.imageContainer} {...panResponder.panHandlers}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={resetImage}
              style={styles.imageWrapper}
            >
              <Image
                source={{ uri: imageUrl }}
                style={[
                  styles.fullscreenImage,
                  {
                    transform: [{ scale }, { translateX }, { translateY }],
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={closeFullscreen}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

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
      <>
        <TouchableOpacity
          style={styles.singlePhotoContainer}
          onPress={() => openFullscreen(0)}
          activeOpacity={0.9}
        >
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
        </TouchableOpacity>
        <Modal
          visible={fullscreenVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFullscreen}
        >
          <FullscreenImage imageUrl={photos[fullscreenIndex]} />
        </Modal>
      </>
    );
  }

  // Handle multiple photos - horizontal scroll with 2 per row
  const renderPhotoItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => {
    const dimensions = imageDimensions[item];
    const itemWidth = width;

    return (
      <TouchableOpacity
        style={[{ width: itemWidth }]}
        onPress={() => openFullscreen(index)}
        activeOpacity={0.9}
      >
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
      </TouchableOpacity>
    );
  };

  return (
    <>
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
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <FullscreenImage imageUrl={photos[fullscreenIndex]} />
      </Modal>
    </>
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  fullscreenBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  fullscreenImage: {
    width,
    height,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
});

export default FullsizeImageCarousel;
