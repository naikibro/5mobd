import { useAuthStore } from "./authStore";
import { useAddressStore } from "./addressStore";

// Custom hook that provides access to both auth and address stores
export const useAppStore = () => {
  const authStore = useAuthStore();
  const addressStore = useAddressStore();

  return {
    auth: authStore,
    address: addressStore,
  };
};

// Re-export individual stores for direct access when needed
export { useAuthStore, useAddressStore };
