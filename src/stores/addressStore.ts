import { create } from "zustand";
import { addressService } from "../services/addressService";
import { Address, AddressWithReviews, Review } from "../types/address";

interface AddressState {
  addresses: Address[];
  reviews: Review[];
  loading: boolean;
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;

  // Actions
  startPolling: () => void;
  stopPolling: () => void;
  fetchAddresses: () => Promise<void>;
  fetchUserAddresses: (userId: string) => Promise<void>;
  fetchPublicAddresses: () => Promise<void>;
  createAddress: (
    addressData: Omit<Address, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  getAddressById: (id: string) => Promise<Address | null>;
  getAddressWithReviews: (id: string) => Promise<AddressWithReviews | null>;
  createReview: (
    reviewData: Omit<Review, "id" | "createdAt">
  ) => Promise<string>;
  getReviewsByAddress: (addressId: string) => Promise<Review[]>;
  uploadPhoto: (file: Blob, path: string) => Promise<string>;
  deletePhoto: (url: string) => Promise<void>;
  searchAddresses: (
    query: string,
    visibility?: "all" | "public" | "private",
    userId?: string
  ) => Promise<Address[]>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  reviews: [],
  loading: false,
  error: null,
  pollingInterval: null,

  startPolling: () => {
    const { stopPolling, fetchAddresses } = get();

    // Stop existing polling if any
    stopPolling();

    // Start new polling every 5 seconds
    const interval = setInterval(() => {
      fetchAddresses();
    }, 5000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });
      const addresses = await addressService.getAllAddresses();
      set({ addresses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchUserAddresses: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const addresses = await addressService.getAddressesByUser(userId);
      set({ addresses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPublicAddresses: async () => {
    try {
      set({ loading: true, error: null });
      const addresses = await addressService.getPublicAddresses();
      set({ addresses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createAddress: async (
    addressData: Omit<Address, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      set({ loading: true, error: null });
      const addressId = await addressService.createAddress(addressData);

      // Refetch addresses after creation
      await get().fetchAddresses();

      set({ loading: false });
      return addressId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAddress: async (id: string, updates: Partial<Address>) => {
    try {
      set({ loading: true, error: null });
      await addressService.updateAddress(id, updates);

      // Refetch addresses after update
      await get().fetchAddresses();

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteAddress: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await addressService.deleteAddress(id);

      // Refetch addresses after deletion
      await get().fetchAddresses();

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getAddressById: async (id: string) => {
    try {
      set({ error: null });
      return await addressService.getAddressById(id);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  getAddressWithReviews: async (id: string) => {
    try {
      set({ error: null });
      return await addressService.getAddressWithReviews(id);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  createReview: async (reviewData: Omit<Review, "id" | "createdAt">) => {
    try {
      set({ loading: true, error: null });
      const reviewId = await addressService.createReview(reviewData);

      // Refetch reviews for the specific address
      const reviews = await addressService.getReviewsByAddress(
        reviewData.addressId
      );
      set({ reviews, loading: false });

      return reviewId;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getReviewsByAddress: async (addressId: string) => {
    try {
      set({ error: null });
      const reviews = await addressService.getReviewsByAddress(addressId);
      set({ reviews });
      return reviews;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  uploadPhoto: async (file: Blob, path: string) => {
    try {
      set({ error: null });
      return await addressService.uploadPhoto(file, path);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deletePhoto: async (url: string) => {
    try {
      set({ error: null });
      await addressService.deletePhoto(url);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  searchAddresses: async (
    searchQuery: string,
    visibility: "all" | "public" | "private" = "all",
    userId?: string
  ) => {
    try {
      set({ error: null });
      return await addressService.searchAddresses(
        searchQuery,
        visibility,
        userId
      );
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ loading }),
}));
