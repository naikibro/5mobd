import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";
import AddressDrawer from "../components/AddressDrawer";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { Address, AddressWithReviews } from "../types/address";
import { RootStackParamList } from "../types/navigation";

const { width, height } = Dimensions.get("window");

const MapScreen = () => {
  const { fetchMapAddresses, getAddressWithReviews, addresses } =
    useAddressStore();
  const { user } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [_loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [selectedAddress, setSelectedAddress] =
    useState<AddressWithReviews | null>(null);
  const [allowedRegion, setAllowedRegion] = useState<Region | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isProcessingMarker, setIsProcessingMarker] = useState(false);
  const mapRef = useRef<MapView>(null);
  const rainbowAnimation = useRef(new Animated.Value(0)).current;
  const snackbarAnimation = useRef(new Animated.Value(0)).current;

  const getInitialRegion = useCallback((): Region => {
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // Fallback to Paris coordinates if location not available
    return {
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [location]);

  // Calculate allowed region with 70km radius
  const calculateAllowedRegion = (userLat: number, userLon: number): Region => {
    // Convert 70km to degrees (approximate)
    // 1 degree latitude ≈ 111km
    // 1 degree longitude ≈ 111km * cos(latitude)
    const latDelta = 70 / 111; // ~0.63 degrees
    const lonDelta = 70 / (111 * Math.cos((userLat * Math.PI) / 180)); // Adjust for latitude

    return {
      latitude: userLat,
      longitude: userLon,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  };

  // Check if a region is within the allowed bounds
  const isRegionAllowed = (region: Region): boolean => {
    if (!allowedRegion) return true;

    const latDiff = Math.abs(region.latitude - allowedRegion.latitude);
    const lonDiff = Math.abs(region.longitude - allowedRegion.longitude);

    // Check if the region center is within the allowed bounds
    const maxLatDiff = allowedRegion.latitudeDelta / 2;
    const maxLonDiff = allowedRegion.longitudeDelta / 2;

    return latDiff <= maxLatDiff && lonDiff <= maxLonDiff;
  };

  // Handle region change and enforce geofencing
  const handleRegionChange = (region: Region) => {
    // Only enforce geofencing if user has moved significantly outside bounds
    if (!isRegionAllowed(region)) {
      // Show snackbar notification only once
      if (!showSnackbar) {
        setShowSnackbar(true);
        Animated.timing(snackbarAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          Animated.timing(snackbarAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowSnackbar(false);
          });
        }, 4000); // Hide snackbar after 4 seconds
      }

      // Snap back to the allowed region gently
      if (mapRef.current && allowedRegion) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(allowedRegion, 500);
        }, 100);
      }
    }
  };

  useEffect(() => {
    getLocationPermission();
    loadAddresses();

    // Start rainbow animation
    const startRainbowAnimation = () => {
      Animated.loop(
        Animated.timing(rainbowAnimation, {
          toValue: 1,
          duration: 6000, // Slower animation - 6 seconds per cycle
          useNativeDriver: false,
        })
      ).start();
    };

    startRainbowAnimation();
  }, [rainbowAnimation]);

  // Set allowed region for simulator fallback
  useEffect(() => {
    if (!allowedRegion && !location) {
      // Set Paris as fallback with 70km radius
      const parisAllowed = calculateAllowedRegion(48.8566, 2.3522);
      setAllowedRegion(parisAllowed);
    }
  }, [allowedRegion, location]);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        await getCurrentLocation();
      } else {
        Alert.alert(
          "Permission de localisation",
          "Pour utiliser cette fonctionnalité, veuillez autoriser l'accès à votre localisation dans les paramètres de l'application."
        );
        setLoading(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("Error getting location permission:", error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);

      // Calculate and set the allowed region (70km radius)
      const allowed = calculateAllowedRegion(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      setAllowedRegion(allowed);

      // Center map on user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.log("Error getting current location:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      // Load public addresses + user's private addresses for map
      await fetchMapAddresses(user?.uid);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading addresses:", error);
    }
  };

  const centerOnUserLocation = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

  const handleMarkerPress = useCallback(
    async (address: Address) => {
      // Prevent multiple rapid clicks on Android
      if (isProcessingMarker) return;

      try {
        setIsProcessingMarker(true);
        setLoading(true);

        // Ensure drawer is closed first to prevent state conflicts on Android
        setShowDrawer(false);

        // Small delay to ensure state is properly reset
        await new Promise((resolve) => setTimeout(resolve, 50));

        const addressWithReviews = await getAddressWithReviews(address.id);
        if (addressWithReviews) {
          setSelectedAddress(addressWithReviews);
          setShowDrawer(true);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching address details:", error);
        // Fallback to basic address if fetch fails
        setSelectedAddress(address as AddressWithReviews);
        setShowDrawer(true);
      } finally {
        setLoading(false);
        // Reset processing flag after a short delay
        setTimeout(() => setIsProcessingMarker(false), 500);
      }
    },
    [getAddressWithReviews, isProcessingMarker]
  );

  const renderMarkers = useMemo(() => {
    return addresses.map((address) => (
      <Marker
        key={address.id}
        coordinate={{
          latitude: address.latitude,
          longitude: address.longitude,
        }}
        title={address.name}
        description={address.description}
        pinColor={address.isPublic ? "#2ecc71" : "#e74c3c"}
        onPress={() => handleMarkerPress(address)}
      />
    ));
  }, [addresses, handleMarkerPress]);

  const RainbowBorder = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      const borderColor = rainbowAnimation.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [
          "#ffffff", // White
          "#b3e5fc", // Light Blue
          "#81d4fa", // Lighter Blue
          "#ffb6e6", // Pink
          "#b39ddb", // Mauve (light purple)
          "#ffffff", // Back to white
        ],
      });

      return (
        <Animated.View
          style={[
            styles.rainbowBorder,
            {
              borderColor,
            },
          ]}
        >
          {children}
        </Animated.View>
      );
    },
    [rainbowAnimation]
  );

  if (permissionStatus !== "granted") {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="location-outline" size={80} color="#bdc3c7" />
        <Text style={styles.permissionTitle}>Localisation requise</Text>
        <Text style={styles.permissionText}>
          Pour afficher la carte et vos adresses, nous avons besoin d'accéder à
          votre localisation.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={getLocationPermission}
        >
          <Text style={styles.permissionButtonText}>
            Autoriser la localisation
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsScale={true}
        mapType="mutedStandard"
        provider="google"
        testID="map-screen"
      >
        {renderMarkers}
        {allowedRegion && (
          <Circle
            center={{
              latitude: allowedRegion.latitude,
              longitude: allowedRegion.longitude,
            }}
            radius={70000} // 70km in meters
            strokeColor="rgba(46, 204, 113, 0.3)"
            fillColor="rgba(46, 204, 113, 0.1)"
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Snackbar notification for geofence violation */}
      {showSnackbar && (
        <Animated.View
          style={[
            styles.snackbarContainer,
            {
              transform: [
                {
                  translateY: snackbarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.snackbar}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.snackbarText}>
              Zone restreinte - Retour à la zone autorisée
            </Text>
            <TouchableOpacity
              onPress={() => {
                Animated.timing(snackbarAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowSnackbar(false);
                });
              }}
              style={styles.snackbarClose}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUserLocation}
        testID="center-on-user-location-button"
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.drawerButton}
        onPress={() => setShowDrawer(true)}
        testID="open-drawer-button"
      >
        <Ionicons name="list" size={24} color="#fff" />
      </TouchableOpacity>

      {user && (
        <RainbowBorder>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("CreateAddress")}
            testID="add-address-button"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </RainbowBorder>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#2ecc71" }]} />
          <Text style={styles.legendText}>Adresses publiques</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#e74c3c" }]} />
          <Text style={styles.legendText}>Adresses privées</Text>
        </View>
      </View>

      <AddressDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        selectedAddressFromMap={selectedAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#2ecc71",
    width: 50,
    height: 50,
    borderRadius: 25,
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
  rainbowBorder: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 108,
    height: 64,
    borderRadius: 32,

    backgroundColor: "transparent",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fab: {
    backgroundColor: "#2ecc71",
    width: 100,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 200,
      },
    }),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#333",
  },
  geofenceIndicator: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  geofenceText: {
    fontSize: 12,
    color: "#2ecc71",
    fontWeight: "600",
    marginLeft: 6,
  },
  snackbarContainer: {
    position: "absolute",
    bottom: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  snackbar: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  snackbarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  snackbarClose: {
    padding: 4,
    marginLeft: 8,
  },
  drawerButton: {
    position: "absolute",
    bottom: 160,
    right: 20,
    backgroundColor: "#2ecc71",
    width: 50,
    height: 50,
    borderRadius: 25,
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
});

export default MapScreen;
