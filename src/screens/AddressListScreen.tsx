import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import PhotoGallery from "../components/PhotoGallery";
import RadiusSlider from "../components/RadiusSlider";
import { useGeocoding } from "../hooks/useGeocoding";
import { useFavorites } from "../hooks/useFavorites";
import { useAddressStore } from "../stores/addressStore";
import { addressService } from "../services/addressService";
import * as Location from "expo-location";
import { Address } from "../types/address";
import { AddressStackParamList } from "../types/navigation";

const { width } = Dimensions.get("window");

const AddressListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AddressStackParamList>>();
  const { loading, isPolling } = useAddressStore();
  const { getStreetName, isLoading: isGeocodingLoading } = useGeocoding();
  const { toggleFavorite, isFavoriteLocal } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [streetNames, setStreetNames] = useState<Map<string, string>>(
    new Map()
  );
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(30); // Default 30km radius
  const processedAddresses = useRef(new Set<string>());

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        // Check if location services are enabled
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          console.log("Location services are disabled");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("Location permission status:", status);

        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log("User location obtained:", location.coords);
          setUserLocation(location);
        } else {
          console.log("Location permission denied, status:", status);
          // For simulator testing, set a default Paris location
          if (__DEV__) {
            console.log("Setting default Paris location for simulator");
            setUserLocation({
              coords: {
                latitude: 48.8566,
                longitude: 2.3522,
                altitude: null,
                accuracy: 100,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            } as Location.LocationObject);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error getting location:", error);

        // For simulator testing, set a default Paris location
        if (__DEV__) {
          console.log(
            "Setting default Paris location for simulator due to error"
          );
          setUserLocation({
            coords: {
              latitude: 48.8566,
              longitude: 2.3522,
              altitude: null,
              accuracy: 100,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as Location.LocationObject);
        }
      }
    };
    getUserLocation();
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      // Only load addresses if we have user location (for distance filtering)
      if (userLocation) {
        console.log(
          "Filtering addresses with user location:",
          userLocation.coords
        );
        const filteredAddresses = await addressService.searchAddresses(
          searchQuery, // Use current search query
          "public",
          undefined,
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          searchRadius
        );
        console.log(
          "Filtered addresses (within 30km):",
          filteredAddresses.length
        );
        setAddresses(filteredAddresses);
      } else {
        console.log("No user location yet, waiting...");
        // Don't load addresses until we have location
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading addresses:", error);
    }
  }, [userLocation, searchRadius, searchQuery]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Refresh addresses when screen comes into focus
  useEffect(() => {
    const refreshOnFocus = () => {
      loadAddresses();
    };

    // Only refresh if we have location
    if (userLocation) {
      refreshOnFocus();
    }
  }, [loadAddresses, userLocation]);

  const loadStreetNames = useCallback(async () => {
    if (addresses.length === 0) return;

    const newStreetNames: string[] = [];

    for (const address of addresses) {
      const key = `${address.latitude},${address.longitude}`;

      // Only fetch if we haven't processed this address yet
      if (!processedAddresses.current.has(key)) {
        processedAddresses.current.add(key);

        try {
          const streetName = await getStreetName({
            latitude: address.latitude,
            longitude: address.longitude,
          });

          if (streetName) {
            newStreetNames.push(key, streetName);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error getting street name:", error);
        }
      }
    }

    // Only update state if we actually got new street names
    if (newStreetNames.length > 0) {
      setStreetNames((prev) => {
        const updated = new Map(prev);
        for (let i = 0; i < newStreetNames.length; i += 2) {
          updated.set(newStreetNames[i], newStreetNames[i + 1]);
        }
        return updated;
      });
    }
  }, [addresses, getStreetName]);

  useEffect(() => {
    if (addresses.length > 0) {
      loadStreetNames();
    }
  }, [addresses, loadStreetNames]);

  // Reset processed addresses when addresses change significantly
  useEffect(() => {
    processedAddresses.current.clear();
  }, [addresses.length]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        // Search only in public addresses within 30km
        const searchResults = await addressService.searchAddresses(
          query,
          "public",
          undefined,
          userLocation
            ? {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }
            : undefined,
          searchRadius
        );
        setAddresses(searchResults);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error searching addresses:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadAddresses();
    }
  };

  const handleRadiusChange = useCallback(
    async (low: number, high: number, fromUser: boolean) => {
      // Only update if it's from user interaction OR if the value is actually different
      if (fromUser || low !== searchRadius) {
        setSearchRadius(low);
        // loadAddresses will be called automatically due to searchRadius dependency
      }
    },
    [searchRadius]
  );

  const renderAddress = ({ item }: { item: Address }) => {
    const key = `${item.latitude},${item.longitude}`;
    const streetName = streetNames.get(key);
    const isFavorite = isFavoriteLocal(item.id);

    const handleFavoritePress = async () => {
      try {
        const wasFavorite = isFavorite;
        await toggleFavorite(item.id);

        // Show toast message
        if (!wasFavorite) {
          Alert.alert("⭐️", "Adresse ajoutée aux favoris⭐️", [], {
            cancelable: true,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error toggling favorite:", error);
      }
    };

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("AddressDetails", { address: item })}
      >
        <View style={styles.photosContainer}>
          <PhotoGallery photos={item.photos || []} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.location}>
                {streetName ||
                  `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
              </Text>
              {isGeocodingLoading && !streetName && (
                <ActivityIndicator
                  size="small"
                  color="#666"
                  style={styles.geocodingLoader}
                />
              )}
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
              testID={`favorite-button-${item.id}`}
            >
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={20}
                color={isFavorite ? "#ffd700" : "#666"}
              />
            </TouchableOpacity>
            <Ionicons
              name={item.isPublic ? "globe" : "lock-closed"}
              size={20}
              color={item.isPublic ? "#2ecc71" : "#e74c3c"}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          testID="addresses-search-input"
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
        ListHeaderComponent={() => (
          <RadiusSlider
            searchRadius={searchRadius}
            onRadiusChange={handleRadiusChange}
            addressesCount={addresses.length}
          />
        )}
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
        testID="add-address-button"
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
  geocodingLoader: {
    marginLeft: 8,
  },
  itemActions: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    marginRight: 8,
    padding: 4,
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
