import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";
import { Address, AddressWithReviews } from "../types/address";
import AddressDetailsModal from "../components/AddressDetailsModal";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [selectedAddress, setSelectedAddress] =
    useState<AddressWithReviews | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const rainbowAnimation = useRef(new Animated.Value(0)).current;

  const getInitialRegion = (): Region => {
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
      console.error("Error getting location permission:", error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);

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

  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleMarkerPress = async (address: Address) => {
    try {
      setLoading(true);
      const addressWithReviews = await getAddressWithReviews(address.id);
      if (addressWithReviews) {
        setSelectedAddress(addressWithReviews);
        setModalVisible(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching address details:", error);
      // Fallback to basic address if fetch fails
      setSelectedAddress(address as AddressWithReviews);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAddress(null);
  };

  const handleReviewAdded = async () => {
    if (selectedAddress) {
      try {
        const updatedAddress = await getAddressWithReviews(selectedAddress.id);
        if (updatedAddress) {
          setSelectedAddress(updatedAddress);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error refreshing address after review:", error);
      }
    }
  };

  const renderMarkers = () => {
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
  };

  const RainbowBorder = ({ children }: { children: React.ReactNode }) => {
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
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

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
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        followsUserLocation={true}
        showsBuildings={true}
        showsTraffic={true}
        showsPointsOfInterest={true}
        testID="map-screen"
      >
        {renderMarkers()}
      </MapView>

      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUserLocation}
        testID="center-on-user-location-button"
      >
        <Ionicons name="locate" size={24} color="#fff" />
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

      <AddressDetailsModal
        visible={modalVisible}
        address={selectedAddress}
        onClose={closeModal}
        loading={loading}
        onReviewAdded={handleReviewAdded}
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
});

export default MapScreen;
