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
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useAddress } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { AddressWithReviews } from "../types/address";
import AddressDetailsModal from "../components/AddressDetailsModal";

const { width, height } = Dimensions.get("window");

const MapScreen = () => {
  const { getPublicAddresses, getAddressWithReviews } = useAddress();
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [addresses, setAddresses] = useState<AddressWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [selectedAddress, setSelectedAddress] =
    useState<AddressWithReviews | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: 48.8566, // Paris coordinates as default
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    getLocationPermission();
    loadAddresses();
  }, []);

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
      console.error("Error getting current location:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const publicAddresses = await getPublicAddresses();
      setAddresses(publicAddresses as AddressWithReviews[]);
    } catch (error) {
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

  const handleMarkerPress = async (address: AddressWithReviews) => {
    try {
      setLoading(true);
      const addressWithReviews = await getAddressWithReviews(address.id);
      if (addressWithReviews) {
        setSelectedAddress(addressWithReviews);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
      // Fallback to basic address if fetch fails
      setSelectedAddress(address);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAddress(null);
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
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {renderMarkers()}
      </MapView>

      <TouchableOpacity
        style={styles.centerButton}
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
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
