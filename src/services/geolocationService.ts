import * as Location from "expo-location";

interface Geocode {
  latitude: number;
  longitude: number;
}

/* TODO : add unit tests for this service */

class GeolocationService {
  async getCurrentPosition() {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return position;
  }

  // ----- T R A N S F O R M E R -----
  async transformGeocodeToStreetName(geocode: Geocode) {
    const streetName = await Location.reverseGeocodeAsync(geocode);
    return streetName[0].street;
  }

  async transformStreetNameToGeocode(streetName: string) {
    const geocode = await Location.geocodeAsync(streetName);
    if (geocode.length > 0) {
      return geocode[0];
    }
    return null;
  }
}

export default new GeolocationService();
