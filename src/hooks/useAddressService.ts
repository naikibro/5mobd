import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { addressService } from "../services/addressService";
import { Address } from "../types/address";

export const useAddressService = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  const loadAddresses = useCallback(
    async (radius: number, searchQuery: string = "") => {
      if (!userLocation) return;

      try {
        setLoading(true);
        const filteredAddresses = await addressService.searchAddresses(
          searchQuery,
          "public",
          undefined,
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          radius
        );
        setAddresses(filteredAddresses);
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  const searchAddresses = useCallback(
    async (query: string, radius: number) => {
      if (!userLocation) return;

      try {
        setLoading(true);
        const searchResults = await addressService.searchAddresses(
          query,
          "public",
          undefined,
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
          radius
        );
        setAddresses(searchResults);
      } catch (error) {
        console.error("Error searching addresses:", error);
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );

  const initializeLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
        return location;
      } else if (__DEV__) {
        // Fallback for simulator
        const fallbackLocation = {
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
        } as Location.LocationObject;
        setUserLocation(fallbackLocation);
        return fallbackLocation;
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
    return null;
  }, []);

  return {
    addresses,
    loading,
    userLocation,
    loadAddresses,
    searchAddresses,
    initializeLocation,
  };
};
