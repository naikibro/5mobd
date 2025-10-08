import { useCallback, useRef, useState } from "react";
import * as Location from "expo-location";

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
  public readonly MIN_INTERVAL = 2000; // 2 seconds between calls
  public readonly MAX_CALLS_PER_MINUTE = 30; // Conservative limit
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
      console.warn(
        `Geocoding rate limit exceeded: ${this.MAX_CALLS_PER_MINUTE} calls per minute`
      );
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
        console.warn(`Geocoding rate limit exceeded, waiting ${waitTime}ms`);

        // Wait and retry once
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        if (!rateLimiter.canMakeCall()) {
          console.warn(
            "Geocoding still rate limited after retry, skipping call"
          );
          return null;
        }
      }

      const geocodePromise = (async () => {
        try {
          setIsLoading(true);
          setError(null);

          const result = await Location.reverseGeocodeAsync(geocode);
          const streetName = result[0]?.street || null;

          // Cache the result
          cache.set(geocode, streetName);

          return streetName;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Geocoding failed";
          console.error("Geocoding error:", errorMessage);
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
      const results = await Promise.allSettled(
        geocodes.map((geocode) => getStreetName(geocode))
      );

      return results.map((result) =>
        result.status === "fulfilled" ? result.value : null
      );
    },
    [getStreetName]
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
