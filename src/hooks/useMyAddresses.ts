import { useCallback, useEffect, useState } from "react";
import { myAddressesService } from "../services/myAddressesService";
import { useAuthStore } from "../stores/authStore";
import { useAddressStore } from "../stores/addressStore";
import { Address } from "../types/address";

interface MyAddressesState {
  createdAddresses: Address[];
  favoriteAddresses: Address[];
  combinedAddresses: Address[];
  loading: boolean;
  error: string | null;
}

export const useMyAddresses = () => {
  const { user } = useAuthStore();
  const { favorites: generalFavorites } = useAddressStore();
  const [state, setState] = useState<MyAddressesState>({
    createdAddresses: [],
    favoriteAddresses: [],
    combinedAddresses: [],
    loading: false,
    error: null,
  });

  // Load all addresses for the current user
  const loadMyAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { created, favorites, combined } =
        await myAddressesService.getMyAddresses(user.uid);

      setState((prev) => ({
        ...prev,
        createdAddresses: created,
        favoriteAddresses: favorites,
        combinedAddresses: combined,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [user]);

  // Search in user's addresses
  const searchMyAddresses = useCallback(
    async (searchQuery: string) => {
      if (!user) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const [createdResults, favoriteResults] = await Promise.all([
          myAddressesService.searchUserAddresses(user.uid, searchQuery),
          myAddressesService.searchFavoriteAddresses(user.uid, searchQuery),
        ]);

        // Combine results, avoiding duplicates
        const combined = [...createdResults];
        favoriteResults.forEach((fav) => {
          if (!createdResults.find((addr) => addr.id === fav.id)) {
            combined.push(fav);
          }
        });

        setState((prev) => ({
          ...prev,
          createdAddresses: createdResults,
          favoriteAddresses: favoriteResults,
          combinedAddresses: combined,
          loading: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    },
    [user]
  );

  // Add address to favorites
  const addToFavorites = useCallback(
    async (addressId: string) => {
      if (!user) return;

      try {
        setState((prev) => ({ ...prev, error: null }));
        await myAddressesService.addToFavorites(user.uid, addressId);

        // Reload addresses to reflect the change
        await loadMyAddresses();
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
        throw error;
      }
    },
    [user, loadMyAddresses]
  );

  // Remove address from favorites
  const removeFromFavorites = useCallback(
    async (addressId: string) => {
      if (!user) return;

      try {
        setState((prev) => ({ ...prev, error: null }));
        await myAddressesService.removeFromFavorites(user.uid, addressId);

        // Reload addresses to reflect the change
        await loadMyAddresses();
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
        throw error;
      }
    },
    [user, loadMyAddresses]
  );

  // Check if address is favorite
  const isFavorite = useCallback(
    async (addressId: string) => {
      if (!user) return false;

      try {
        setState((prev) => ({ ...prev, error: null }));
        return await myAddressesService.isFavorite(user.uid, addressId);
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
        return false;
      }
    },
    [user]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (addressId: string) => {
      if (!user) return;

      const isCurrentlyFavorite = state.favoriteAddresses.some(
        (fav) => fav.id === addressId
      );

      try {
        if (isCurrentlyFavorite) {
          await removeFromFavorites(addressId);
        } else {
          await addToFavorites(addressId);
        }
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
        throw error;
      }
    },
    [user, state.favoriteAddresses, addToFavorites, removeFromFavorites]
  );

  // Filter addresses by type
  const getFilteredAddresses = useCallback(
    (filter: "all" | "created" | "favorites") => {
      switch (filter) {
        case "created":
          return state.createdAddresses;
        case "favorites":
          return state.favoriteAddresses;
        default:
          return state.combinedAddresses;
      }
    },
    [state.createdAddresses, state.favoriteAddresses, state.combinedAddresses]
  );

  // Check if address is user-created
  const isUserCreated = useCallback(
    (address: Address) => {
      return address.userId === user?.uid;
    },
    [user]
  );

  // Check if address is favorite (local check)
  const isFavoriteLocal = useCallback(
    (addressId: string) => {
      return state.favoriteAddresses.some((fav) => fav.id === addressId);
    },
    [state.favoriteAddresses]
  );

  // Load addresses on mount
  useEffect(() => {
    if (user) {
      loadMyAddresses();
    }
  }, [user, loadMyAddresses]);

  // Auto-refresh when general favorites change
  useEffect(() => {
    if (user) {
      // Refresh favorites when general favorites change
      loadMyAddresses();
    }
  }, [generalFavorites, user, loadMyAddresses]);

  return {
    // State
    ...state,

    // Actions
    loadMyAddresses,
    searchMyAddresses,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    refreshMyAddresses: loadMyAddresses,

    // Utilities
    getFilteredAddresses,
    isUserCreated,
    isFavoriteLocal,
  };
};
