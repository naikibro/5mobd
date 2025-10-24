import { useCallback, useEffect, useState } from "react";
import { useAddressStore } from "../stores/addressStore";
import { useAuthStore } from "../stores/authStore";

export const useFavorites = () => {
  const { user } = useAuthStore();
  const {
    favorites,
    fetchUserFavorites,
    fetchUserFavoritesWithAddresses,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  } = useAddressStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user favorites on mount
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      await fetchUserFavorites(user.uid);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserFavorites]);

  const loadFavoritesWithAddresses = useCallback(async () => {
    if (!user) return [];

    try {
      setError(null);
      return await fetchUserFavoritesWithAddresses(user.uid);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, [user, fetchUserFavoritesWithAddresses]);

  const addToFavoritesHandler = useCallback(
    async (addressId: string) => {
      if (!user) return;

      try {
        setError(null);
        await addToFavorites(user.uid, addressId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user, addToFavorites]
  );

  const removeFromFavoritesHandler = useCallback(
    async (addressId: string) => {
      if (!user) return;

      try {
        setError(null);
        await removeFromFavorites(user.uid, addressId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user, removeFromFavorites]
  );

  const checkIsFavorite = useCallback(
    async (addressId: string) => {
      if (!user) return false;

      try {
        setError(null);
        return await isFavorite(user.uid, addressId);
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [user, isFavorite]
  );

  const toggleFavorite = useCallback(
    async (addressId: string) => {
      if (!user) return;

      const isCurrentlyFavorite = favorites.includes(addressId);

      try {
        if (isCurrentlyFavorite) {
          await removeFromFavoritesHandler(addressId);
        } else {
          await addToFavoritesHandler(addressId);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user, favorites, addToFavoritesHandler, removeFromFavoritesHandler]
  );

  return {
    favorites,
    loading,
    error,
    loadFavorites,
    loadFavoritesWithAddresses,
    addToFavorites: addToFavoritesHandler,
    removeFromFavorites: removeFromFavoritesHandler,
    isFavorite: checkIsFavorite,
    toggleFavorite,
    isFavoriteLocal: useCallback(
      (addressId: string) => favorites.includes(addressId),
      [favorites]
    ),
  };
};
