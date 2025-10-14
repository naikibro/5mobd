import { useCallback, useRef, useState } from "react";
import googleMapsService from "../services/googleMapsService";

interface Geocode {
  latitude: number;
  longitude: number;
}

interface CachedGeocodeResult {
  streetName: string | null;
  timestamp: number;
}

class GeocodingCache {
  private cache = new Map<string, CachedGeocodeResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  getKey(geocode: Geocode): string {
    return `${geocode.latitude.toFixed(4)},${geocode.longitude.toFixed(4)}`;
  }

  get(geocode: Geocode): string | null {
    const key = this.getKey(geocode);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.streetName;
    }

    return null;
  }

  set(geocode: Geocode, streetName: string | null): void {
    const key = this.getKey(geocode);
    this.cache.set(key, {
      streetName,
      timestamp: Date.now(),
    });
  }
}

class RateLimiter {
  public lastCall = 0;
  public readonly MIN_INTERVAL = 100; // 100ms between calls (Google Maps allows much higher rates)
  public readonly MAX_CALLS_PER_MINUTE = 1000; // Google Maps allows up to 50 requests per second
  public callsThisMinute = 0;
  private minuteStart = Date.now();

  canMakeCall(): boolean {
    const now = Date.now();

    // Reset counter every minute
    if (now - this.minuteStart >= 60000) {
      this.callsThisMinute = 0;
      this.minuteStart = now;
    }

    // Check if we've exceeded the per-minute limit
    if (this.callsThisMinute >= this.MAX_CALLS_PER_MINUTE) {
      return false;
    }

    // Check minimum interval between calls
    if (now - this.lastCall >= this.MIN_INTERVAL) {
      this.lastCall = now;
      this.callsThisMinute++;
      return true;
    }

    return false;
  }

  getTimeUntilNextCall(): number {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    return Math.max(0, this.MIN_INTERVAL - timeSinceLastCall);
  }
}

const cache = new GeocodingCache();
const rateLimiter = new RateLimiter();

export const useGeocoding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingCalls = useRef(new Map<string, Promise<string | null>>());

  const getStreetName = useCallback(
    async (geocode: Geocode): Promise<string | null> => {
      const cacheKey = cache.getKey(geocode);

      // Check cache first
      const cached = cache.get(geocode);
      if (cached !== null) {
        return cached;
      }

      // Check if there's already a pending call for this geocode
      if (pendingCalls.current.has(cacheKey)) {
        return pendingCalls.current.get(cacheKey)!;
      }

      // Rate limiting check
      if (!rateLimiter.canMakeCall()) {
        const waitTime = rateLimiter.getTimeUntilNextCall();

        // Wait and retry once
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        if (!rateLimiter.canMakeCall()) {
          return null;
        }
      }

      const geocodePromise = (async () => {
        try {
          setIsLoading(true);
          setError(null);

          const streetName = await googleMapsService.reverseGeocode(geocode);

          // Cache the result
          cache.set(geocode, streetName);

          return streetName;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Geocoding failed";
          console.error("Google Maps geocoding error:", errorMessage);
          setError(errorMessage);

          // Cache null result to avoid repeated failed calls
          cache.set(geocode, null);

          return null;
        } finally {
          setIsLoading(false);
          pendingCalls.current.delete(cacheKey);
        }
      })();

      pendingCalls.current.set(cacheKey, geocodePromise);
      return geocodePromise;
    },
    []
  );

  const batchGetStreetNames = useCallback(
    async (geocodes: Geocode[]): Promise<(string | null)[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const results = await googleMapsService.batchReverseGeocode(geocodes);

        // Cache the results
        geocodes.forEach((geocode, index) => {
          cache.set(geocode, results[index]);
        });

        return results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Batch geocoding failed";
        console.error("Google Maps batch geocoding error:", errorMessage);
        setError(errorMessage);

        return geocodes.map(() => null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getRateLimitStatus = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - rateLimiter.lastCall;
    const timeUntilNextCall = rateLimiter.getTimeUntilNextCall();

    return {
      canMakeCall: rateLimiter.canMakeCall(),
      timeUntilNextCall,
      callsThisMinute: rateLimiter.callsThisMinute,
      maxCallsPerMinute: rateLimiter.MAX_CALLS_PER_MINUTE,
    };
  }, []);

  return {
    getStreetName,
    batchGetStreetNames,
    getRateLimitStatus,
    isLoading,
    error,
  };
};
