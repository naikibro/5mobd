import { create } from "zustand";
import { User } from "firebase/auth";
import { authService, UserProfile } from "../services/authService";

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUserPhoto: (photoUrl: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  error: null,

  initialize: () => {
    set({ loading: true });

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      set({ user });

      if (user) {
        try {
          const userProfile = await authService.loadUserProfile();
          set({ userProfile, loading: false, error: null });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error loading user profile:", error);
          set({
            userProfile: null,
            loading: false,
            error: "Failed to load user profile",
          });
        }
      } else {
        set({ userProfile: null, loading: false, error: null });
      }
    });

    return unsubscribe;
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ loading: true, error: null });
      await authService.signUp(email, password, displayName);
      // User profile will be loaded automatically via auth state change
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      await authService.signIn(email, password);
      // User profile will be loaded automatically via auth state change
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await authService.signOut();
      set({ user: null, userProfile: null, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserProfile: async (displayName: string) => {
    try {
      set({ loading: true, error: null });
      await authService.updateUserProfile(displayName);
      await get().loadUserProfile();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserEmail: async (email: string) => {
    try {
      set({ loading: true, error: null });
      await authService.updateUserEmail(email);
      await get().loadUserProfile();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserPassword: async (password: string) => {
    try {
      set({ loading: true, error: null });
      await authService.updateUserPassword(password);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUserPhoto: async (photoUrl: string) => {
    try {
      set({ loading: true, error: null });
      await authService.updateUserPhoto(photoUrl);
      await get().loadUserProfile();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadUserProfile: async () => {
    try {
      set({ loading: true, error: null });
      const userProfile = await authService.loadUserProfile();
      set({ userProfile, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ loading }),
}));
