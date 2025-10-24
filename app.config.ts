import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "5mobd",
  slug: "5mobd",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    scheme: "5mobd",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Cette application utilise votre localisation pour afficher les adresses sur la carte et vous permettre de créer de nouvelles adresses.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Cette application utilise votre localisation pour afficher les adresses sur la carte et vous permettre de créer de nouvelles adresses.",
      NSPhotoLibraryUsageDescription:
        "Cette application a besoin d'accéder à votre photothèque pour vous permettre de sélectionner une photo de profil.",
      NSCameraUsageDescription:
        "Cette application a besoin d'accéder à votre appareil photo pour vous permettre de prendre une photo de profil.",
      ITSAppUsesNonExemptEncryption: false,
    },
    bundleIdentifier: "com.pacificknowledge.pereoonews",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "POST_NOTIFICATIONS",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
    ],
    package: "com.pacificknowledge.pereoonews",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: ["expo-dev-client"],
  extra: {
    eas: {
      projectId: "7dc0ea54-ac09-458b-9e6d-1e16a261595e",
    },
  },
});
