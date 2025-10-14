import GoogleMapsService from "../googleMapsService";

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error
console.error = jest.fn();

describe("GoogleMapsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe("reverseGeocode", () => {
    it("should return formatted address for valid coordinates", async () => {
      const mockResponse = {
        status: "OK",
        results: [
          {
            formatted_address: "123 Rue de la Paix, Paris, France",
            types: ["street_address"],
            address_components: [],
            geometry: {
              location: { lat: 48.8566, lng: 2.3522 },
              location_type: "ROOFTOP",
            },
            place_id: "test-place-id",
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBe("123 Rue de la Paix, Paris, France");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("latlng=48.8566,2.3522")
      );
    });

    it("should prioritize street_address over other types", async () => {
      const mockResponse = {
        status: "OK",
        results: [
          {
            formatted_address: "Rue de la Paix, Paris, France",
            types: ["route"],
            address_components: [],
            geometry: {
              location: { lat: 48.8566, lng: 2.3522 },
              location_type: "GEOMETRIC_CENTER",
            },
            place_id: "test-place-id",
          },
          {
            formatted_address: "123 Rue de la Paix, Paris, France",
            types: ["street_address"],
            address_components: [],
            geometry: {
              location: { lat: 48.8566, lng: 2.3522 },
              location_type: "ROOFTOP",
            },
            place_id: "test-place-id-2",
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBe("123 Rue de la Paix, Paris, France");
    });

    it("should return null for OVER_QUERY_LIMIT status", async () => {
      const mockResponse = {
        status: "OVER_QUERY_LIMIT",
        results: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });

    it("should return null for ZERO_RESULTS status", async () => {
      const mockResponse = {
        status: "ZERO_RESULTS",
        results: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });

    it("should handle HTTP errors", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await GoogleMapsService.reverseGeocode({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });
  });

  describe("batchReverseGeocode", () => {
    it("should process multiple geocodes sequentially", async () => {
      const mockResponse1 = {
        status: "OK",
        results: [
          {
            formatted_address: "Address 1",
            types: ["street_address"],
            address_components: [],
            geometry: {
              location: { lat: 1, lng: 1 },
              location_type: "ROOFTOP",
            },
            place_id: "1",
          },
        ],
      };
      const mockResponse2 = {
        status: "OK",
        results: [
          {
            formatted_address: "Address 2",
            types: ["street_address"],
            address_components: [],
            geometry: {
              location: { lat: 2, lng: 2 },
              location_type: "ROOFTOP",
            },
            place_id: "2",
          },
        ],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const geocodes = [
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 },
      ];

      const results = await GoogleMapsService.batchReverseGeocode(geocodes);

      expect(results).toEqual(["Address 1", "Address 2"]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle null results in batch processing", async () => {
      const mockResponse1 = {
        status: "OK",
        results: [
          {
            formatted_address: "Address 1",
            types: ["street_address"],
            address_components: [],
            geometry: {
              location: { lat: 1, lng: 1 },
              location_type: "ROOFTOP",
            },
            place_id: "1",
          },
        ],
      };
      const mockResponse2 = {
        status: "ZERO_RESULTS",
        results: [],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2),
        });

      const geocodes = [
        { latitude: 1, longitude: 1 },
        { latitude: 2, longitude: 2 },
      ];

      const results = await GoogleMapsService.batchReverseGeocode(geocodes);

      expect(results).toEqual(["Address 1", null]);
    });
  });

  describe("getDetailedAddress", () => {
    it("should return detailed address components", async () => {
      const mockResponse = {
        status: "OK",
        results: [
          {
            formatted_address: "123 Rue de la Paix, 75001 Paris, France",
            address_components: [
              { long_name: "123", short_name: "123", types: ["street_number"] },
              {
                long_name: "Rue de la Paix",
                short_name: "Rue de la Paix",
                types: ["route"],
              },
              { long_name: "Paris", short_name: "Paris", types: ["locality"] },
              {
                long_name: "Île-de-France",
                short_name: "Île-de-France",
                types: ["administrative_area_level_1"],
              },
              { long_name: "France", short_name: "FR", types: ["country"] },
              {
                long_name: "75001",
                short_name: "75001",
                types: ["postal_code"],
              },
            ],
            geometry: {
              location: { lat: 48.8566, lng: 2.3522 },
              location_type: "ROOFTOP",
            },
            place_id: "test-place-id",
            types: ["street_address"],
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.getDetailedAddress({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toEqual({
        formattedAddress: "123 Rue de la Paix, 75001 Paris, France",
        streetNumber: "123",
        route: "Rue de la Paix",
        locality: "Paris",
        administrativeAreaLevel1: "Île-de-France",
        country: "France",
        postalCode: "75001",
      });
    });

    it("should return null for invalid response", async () => {
      const mockResponse = {
        status: "ZERO_RESULTS",
        results: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await GoogleMapsService.getDetailedAddress({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });

    it("should handle errors in getDetailedAddress", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await GoogleMapsService.getDetailedAddress({
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result).toBeNull();
    });
  });
});
