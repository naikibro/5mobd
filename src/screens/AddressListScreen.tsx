import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAddressStore } from "../stores/addressStore";
import { Address } from "../types/address";
import { AddressStackParamList } from "../types/navigation";

const { width } = Dimensions.get("window");

const AddressListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AddressStackParamList>>();
  const {
    fetchPublicAddresses,
    searchAddresses,
    loading,
    addresses,
    isPolling,
  } = useAddressStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    [key: string]: { width: number; height: number };
  }>({});

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      await fetchPublicAddresses();
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await searchAddresses(query, "public");
        // Note: The search results will be handled by the store
      } catch (error) {
        console.error("Error searching addresses:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadAddresses();
    }
  };

  const renderPhotos = (photos: string[]) => {
    if (!photos || photos.length === 0) {
      return (
        <View style={styles.noPhotosContainer}>
          <Ionicons name="image-outline" size={24} color="#bdc3c7" />
        </View>
      );
    }

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

    // Multiple photos - show first photo with overlay count
    return (
      <View style={styles.multiplePhotosContainer}>
        <Image
          source={{ uri: photos[0] }}
          style={styles.multiplePhotosMain}
          resizeMode="cover"
        />
        <View style={styles.photoCountOverlay}>
          <Ionicons name="images" size={16} color="#fff" />
          <Text style={styles.photoCountText}>{photos.length}</Text>
        </View>
      </View>
    );
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("AddressDetails", { address: item })}
    >
      {item.photos && item.photos.length > 0 && (
        <View style={styles.photosContainer}>{renderPhotos(item.photos)}</View>
      )}
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.location}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <Ionicons
            name={item.isPublic ? "globe" : "lock-closed"}
            size={20}
            color={item.isPublic ? "#2ecc71" : "#e74c3c"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !isPolling && addresses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement des adresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une adresse..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {(isSearching || (loading && !isPolling)) && (
          <ActivityIndicator size="small" color="#2ecc71" />
        )}
      </View>

      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={Platform.select({ web: width > 768 ? 2 : 1, default: 1 })}
        key={Platform.select({
          web: width > 768 ? "two-columns" : "one-column",
          default: "one-column",
        })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Aucune adresse trouvée"
                : "Aucune adresse publique"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Essayez avec d'autres mots-clés"
                : "Les adresses publiques apparaîtront ici"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateAddress")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
      },
    }),
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    ...Platform.select({
      web: {
        flex: width > 768 ? 0.48 : 1,
        marginHorizontal: width > 768 ? "1%" : 0,
      },
    }),
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  itemActions: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2ecc71",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photosContainer: {
    overflow: "hidden",
  },
  noPhotosContainer: {
    height: 120,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  singlePhoto: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 120,
    maxHeight: 300,
  },
  singlePhotoContainer: {
    width: "100%",
  },
  multiplePhotosContainer: {
    position: "relative",
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
  },
  multiplePhotosMain: {
    height: 120,
    width: "100%",
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

export default AddressListScreen;
