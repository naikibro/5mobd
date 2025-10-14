import { env } from "../config/env";

interface Geocode {
  latitude: number;
  longitude: number;
}

interface DetailedAddress {
  streetNumber?: string;
  route?: string;
  locality?: string;
  administrativeAreaLevel1?: string;
  country?: string;
  postalCode?: string;
  formattedAddress: string;
}

interface GoogleMapsGeocodeResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

/* TODO : add unit tests for this service */

class GoogleMapsService {
  private readonly API_KEY: string;
  private readonly BASE_URL =
    "https://maps.googleapis.com/maps/api/geocode/json";

  constructor() {
    this.API_KEY = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  async reverseGeocode(geocode: Geocode): Promise<string | null> {
    try {
      // Use result_type filter to get more specific results and language for French
      const url = `${this.BASE_URL}?latlng=${geocode.latitude},${geocode.longitude}&result_type=street_address|route|locality|administrative_area_level_1&language=fr&key=${this.API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleMapsGeocodeResponse = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        // Priority order: street_address > route > locality > administrative_area_level_1
        const priorities = [
          "street_address",
          "route",
          "locality",
          "administrative_area_level_1",
        ];

        for (const priority of priorities) {
          const result = data.results.find((result) =>
            result.types.includes(priority)
          );

          if (result) {
            return result.formatted_address;
          }
        }

        // Fallback to first result if no priority match
        return data.results[0].formatted_address;
      }

      if (data.status === "OVER_QUERY_LIMIT") {
        return null;
      }

      if (data.status === "ZERO_RESULTS") {
        return null;
      }

      return null;
    } catch (error) {
      console.error("Google Maps reverse geocoding error:", error);
      return null;
    }
  }

  async batchReverseGeocode(geocodes: Geocode[]): Promise<(string | null)[]> {
    // Google Maps API doesn't support batch requests, so we'll process them sequentially
    // with proper rate limiting
    const results: (string | null)[] = [];

    for (const geocode of geocodes) {
      const result = await this.reverseGeocode(geocode);
      results.push(result);

      // Add delay between requests to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  async getDetailedAddress(geocode: Geocode): Promise<DetailedAddress | null> {
    try {
      const url = `${this.BASE_URL}?latlng=${geocode.latitude},${geocode.longitude}&language=fr&key=${this.API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GoogleMapsGeocodeResponse = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        const detailedAddress: DetailedAddress = {
          formattedAddress: result.formatted_address,
        };

        // Extract address components
        addressComponents.forEach((component) => {
          if (component.types.includes("street_number")) {
            detailedAddress.streetNumber = component.long_name;
          }
          if (component.types.includes("route")) {
            detailedAddress.route = component.long_name;
          }
          if (component.types.includes("locality")) {
            detailedAddress.locality = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            detailedAddress.administrativeAreaLevel1 = component.long_name;
          }
          if (component.types.includes("country")) {
            detailedAddress.country = component.long_name;
          }
          if (component.types.includes("postal_code")) {
            detailedAddress.postalCode = component.long_name;
          }
        });

        return detailedAddress;
      }

      return null;
    } catch (error) {
      console.error("Google Maps detailed address error:", error);
      return null;
    }
  }
}

export default new GoogleMapsService();
