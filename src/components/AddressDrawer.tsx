import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AddressDetailsView from "./AddressDetailsView";
import AddressList from "./AddressList";
import RadiusSlider from "./RadiusSlider";
import { useAddressService } from "../hooks/useAddressService";
import { useFavorites } from "../hooks/useFavorites";
import { useGeocoding } from "../hooks/useGeocoding";
import { useAddressStore } from "../stores/addressStore";
import { Address } from "../types/address";

const { width } = Dimensions.get("window");

interface AddressDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  selectedAddressFromMap?: Address | null;
}

const AddressDrawer: React.FC<AddressDrawerProps> = ({
  isVisible,
  onClose,
  selectedAddressFromMap,
}) => {
  const { getAddressWithReviews } = useAddressStore();
  const { getStreetName, isLoading: isGeocodingLoading } = useGeocoding();
  const { toggleFavorite, isFavoriteLocal } = useFavorites();

  const {
    addresses,
    loading,
    userLocation,
    loadAddresses,
    searchAddresses,
    initializeLocation,
  } = useAddressService();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(30);
  const [streetNames, setStreetNames] = useState<Map<string, string>>(
    new Map()
  );
  const [currentView, setCurrentView] = useState<"list" | "details">("list");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressWithReviews, setAddressWithReviews] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [streetAddress, setStreetAddress] = useState<string | null>(null);

  const processedAddresses = useRef(new Set<string>());
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Load addresses when location is available
  useEffect(() => {
    if (userLocation) {
      loadAddresses(searchRadius, searchQuery);
    }
  }, [userLocation, searchRadius, searchQuery]);

  // Handle drawer animation
  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  // Handle address selection from map
  useEffect(() => {
    if (selectedAddressFromMap && isVisible) {
      const timer = setTimeout(() => {
        handleAddressPress(selectedAddressFromMap);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedAddressFromMap, isVisible]);

  // Load street names for addresses
  useEffect(() => {
    if (addresses.length === 0) return;

    const loadStreetNames = async () => {
      const newStreetNames: string[] = [];

      // Clear processed addresses when addresses change
      processedAddresses.current.clear();

      for (const address of addresses) {
        const key = `${address.latitude},${address.longitude}`;

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
            console.error("Error getting street name:", error);
          }
        }
      }

      if (newStreetNames.length > 0) {
        setStreetNames((prev) => {
          const updated = new Map(prev);
          for (let i = 0; i < newStreetNames.length; i += 2) {
            updated.set(newStreetNames[i], newStreetNames[i + 1]);
          }
          return updated;
        });
      }
    };

    loadStreetNames();
  }, [addresses, getStreetName]);

  const handleAddressPress = useCallback(
    async (address: Address) => {
      setSelectedAddress(address);
      setCurrentView("details");
      setDetailsLoading(true);

      try {
        const details = await getAddressWithReviews(address.id);
        setAddressWithReviews(details);

        const streetName = await getStreetName({
          latitude: address.latitude,
          longitude: address.longitude,
        });
        setStreetAddress(streetName);
      } catch (error) {
        console.error("Error loading address details:", error);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getAddressWithReviews, getStreetName]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        await searchAddresses(query, searchRadius);
      } else {
        await loadAddresses(searchRadius);
      }
    },
    [searchAddresses, loadAddresses, searchRadius]
  );

  const handleRadiusChange = useCallback(
    async (radius: number) => {
      setSearchRadius(radius);
      if (searchQuery.trim()) {
        await searchAddresses(searchQuery, radius);
      } else {
        await loadAddresses(radius);
      }
    },
    [searchAddresses, loadAddresses, searchQuery]
  );

  const handleFavoritePress = useCallback(
    async (addressId: string) => {
      try {
        await toggleFavorite(addressId);
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [toggleFavorite]
  );

  const handleBackToList = useCallback(() => {
    setCurrentView("list");
    setSelectedAddress(null);
    setAddressWithReviews(null);
    setStreetAddress(null);
  }, []);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            {currentView === "details" ? (
              <TouchableOpacity
                onPress={handleBackToList}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.drawerTitle}>
              {currentView === "details"
                ? "Détails de l'adresse"
                : "Adresses Publiques"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {currentView === "list" ? (
            <>
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
                {loading && <ActivityIndicator size="small" color="#2ecc71" />}
              </View>

              <RadiusSlider
                initialValue={searchRadius}
                onValueChange={handleRadiusChange}
                addressesCount={addresses.length}
              />

              <AddressList
                addresses={addresses}
                streetNames={streetNames}
                isGeocodingLoading={isGeocodingLoading}
                onAddressPress={handleAddressPress}
                onFavoritePress={handleFavoritePress}
                isFavorite={isFavoriteLocal}
                searchQuery={searchQuery}
              />
            </>
          ) : (
            <AddressDetailsView
              selectedAddress={selectedAddress}
              addressWithReviews={addressWithReviews}
              detailsLoading={detailsLoading}
              streetAddress={streetAddress}
              onBackToList={handleBackToList}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawerContainer: {
    width: width * 0.85,
    backgroundColor: "#f5f5f5",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
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
  backButton: {
    padding: 4,
    marginRight: 8,
  },
});

export default AddressDrawer;
