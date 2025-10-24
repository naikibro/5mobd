/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Filter addresses by distance from a given location
 * @param addresses Array of addresses to filter
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param maxDistanceKm Maximum distance in kilometers (default: 30)
 * @returns Filtered addresses within the distance
 */
export const filterAddressesByDistance = (
  addresses: any[],
  userLat: number,
  userLon: number,
  maxDistanceKm: number = 30
): any[] => {
  return addresses.filter((address) => {
    const distance = calculateDistance(
      userLat,
      userLon,
      address.latitude,
      address.longitude
    );
    return distance <= maxDistanceKm;
  });
};
