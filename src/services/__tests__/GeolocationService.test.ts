import GeolocationService from "../geolocationService";

// Mock expo-location
jest.mock("expo-location", () => ({
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  Accuracy: {
    Balanced: "balanced",
  },
}));

describe("GeolocationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentPosition", () => {
    it("should get current position", async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 1234567890,
      };

      const { getCurrentPositionAsync } = require("expo-location");
      getCurrentPositionAsync.mockResolvedValueOnce(mockPosition);

      const result = await GeolocationService.getCurrentPosition();

      expect(result).toBe(mockPosition);
      expect(getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: "balanced",
      });
    });

    it("should handle errors when getting position", async () => {
      const mockError = new Error("Location permission denied");
      const { getCurrentPositionAsync } = require("expo-location");
      getCurrentPositionAsync.mockRejectedValueOnce(mockError);

      await expect(GeolocationService.getCurrentPosition()).rejects.toThrow(
        "Location permission denied"
      );
    });
  });

  describe("transformGeocodeToStreetName", () => {
    it("should transform geocode to street name", async () => {
      const mockGeocode = {
        latitude: 48.8566,
        longitude: 2.3522,
      };

      const mockReverseGeocodeResult = [
        {
          street: "Rue de la Paix",
          city: "Paris",
          region: "Île-de-France",
          country: "France",
          postalCode: "75001",
          name: "Rue de la Paix",
          isoCountryCode: "FR",
          timezone: "Europe/Paris",
        },
      ];

      const { reverseGeocodeAsync } = require("expo-location");
      reverseGeocodeAsync.mockResolvedValueOnce(mockReverseGeocodeResult);

      const result = await GeolocationService.transformGeocodeToStreetName(
        mockGeocode
      );

      expect(result).toBe("Rue de la Paix");
      expect(reverseGeocodeAsync).toHaveBeenCalledWith(mockGeocode);
    });

    it("should handle empty reverse geocode results", async () => {
      const mockGeocode = {
        latitude: 0,
        longitude: 0,
      };

      const { reverseGeocodeAsync } = require("expo-location");
      reverseGeocodeAsync.mockResolvedValueOnce([]);

      await expect(
        GeolocationService.transformGeocodeToStreetName(mockGeocode)
      ).rejects.toThrow();
    });

    it("should handle errors in reverse geocoding", async () => {
      const mockGeocode = {
        latitude: 48.8566,
        longitude: 2.3522,
      };

      const mockError = new Error("Reverse geocoding failed");
      const { reverseGeocodeAsync } = require("expo-location");
      reverseGeocodeAsync.mockRejectedValueOnce(mockError);

      await expect(
        GeolocationService.transformGeocodeToStreetName(mockGeocode)
      ).rejects.toThrow("Reverse geocoding failed");
    });
  });

  describe("transformStreetNameToGeocode", () => {
    it("should transform street name to geocode", async () => {
      const streetName = "Rue de la Paix, Paris";
      const mockGeocodeResult = [
        {
          latitude: 48.8566,
          longitude: 2.3522,
          altitude: null,
          accuracy: 10,
        },
      ];

      const { geocodeAsync } = require("expo-location");
      geocodeAsync.mockResolvedValueOnce(mockGeocodeResult);

      const result = await GeolocationService.transformStreetNameToGeocode(
        streetName
      );

      expect(result).toEqual({
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: null,
        accuracy: 10,
      });
      expect(geocodeAsync).toHaveBeenCalledWith(streetName);
    });

    it("should return null when no geocode results", async () => {
      const streetName = "Nonexistent Street";

      const { geocodeAsync } = require("expo-location");
      geocodeAsync.mockResolvedValueOnce([]);

      const result = await GeolocationService.transformStreetNameToGeocode(
        streetName
      );

      expect(result).toBeNull();
    });

    it("should handle errors in geocoding", async () => {
      const streetName = "Invalid Street";

      const mockError = new Error("Geocoding failed");
      const { geocodeAsync } = require("expo-location");
      geocodeAsync.mockRejectedValueOnce(mockError);

      await expect(
        GeolocationService.transformStreetNameToGeocode(streetName)
      ).rejects.toThrow("Geocoding failed");
    });

    it("should return first result when multiple geocodes found", async () => {
      const streetName = "Rue de la Paix";
      const mockGeocodeResults = [
        {
          latitude: 48.8566,
          longitude: 2.3522,
          altitude: null,
          accuracy: 10,
        },
        {
          latitude: 48.8567,
          longitude: 2.3523,
          altitude: null,
          accuracy: 15,
        },
      ];

      const { geocodeAsync } = require("expo-location");
      geocodeAsync.mockResolvedValueOnce(mockGeocodeResults);

      const result = await GeolocationService.transformStreetNameToGeocode(
        streetName
      );

      expect(result).toEqual({
        latitude: 48.8566,
        longitude: 2.3522,
        altitude: null,
        accuracy: 10,
      });
    });
  });
});
