import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import AddressListScreen from "./src/screens/AddressListScreen";
import AddressDetailsScreen from "./src/screens/AddressDetailsScreen";
import MyAddressesScreen from "./src/screens/MyAddressesScreen";
import MapScreen from "./src/screens/MapScreen";
import CreateAddressScreen from "./src/screens/CreateAddressScreen";
import ReviewScreen from "./src/screens/ReviewScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { useAuthStore } from "./src/stores/authStore";
import { useAddressStore } from "./src/stores/addressStore";
import { RootStackParamList, MainTabParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AddressStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: "Adresses publiques" }}
      />
      <Stack.Screen
        name="AddressDetails"
        component={AddressDetailsScreen}
        options={{ title: "Détails" }}
      />
      <Stack.Screen
        name="CreateAddress"
        component={CreateAddressScreen}
        options={{ title: "Créer une adresse" }}
      />
      <Stack.Screen
        name="Reviews"
        component={ReviewScreen}
        options={{ title: "Laisser un avis" }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Addresses") {
            iconName = focused ? "location" : "location-outline";
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "MyAddresses") {
            iconName = focused ? "bookmark" : "bookmark-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "location-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2ecc71",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Addresses"
        component={AddressStack}
        options={{ title: "Adresses", headerShown: false }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: "Carte" }}
      />
      <Tab.Screen
        name="MyAddresses"
        component={MyAddressesScreen}
        options={{ title: "Mes adresses" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Mon profil" }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading, initialize } = useAuthStore();
  const { startPolling, stopPolling } = useAddressStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize auth state listener
    const unsubscribe = initialize();

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [initialize, stopPolling]);

  useEffect(() => {
    // Start polling when user is authenticated
    if (user) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [user, startPolling, stopPolling]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
