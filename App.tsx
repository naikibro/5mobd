import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import MyAddressesScreen from "./src/screens/MyAddressesScreen";
import MapScreen from "./src/screens/MapScreen";
import CreateAddressScreen from "./src/screens/CreateAddressScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { useAuthStore } from "./src/stores/authStore";
import { useAddressStore } from "./src/stores/addressStore";
import { RootStackParamList, MainTabParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          let testID: string;
          if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline";
            testID = "map-tab";
          } else if (route.name === "MyAddresses") {
            iconName = focused ? "bookmark" : "bookmark-outline";
            testID = "my-addresses-tab";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
            testID = "profile-tab";
          } else {
            iconName = "location-outline";
            testID = "default-tab";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
              testID={testID}
            />
          );
        },
        tabBarActiveTintColor: "#2ecc71",
        tabBarInactiveTintColor: "gray",
      })}
    >
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

  if (user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="CreateAddress"
          component={CreateAddressScreen}
          options={{
            title: "Créer une adresse",
            headerShown: true,
            presentation: "modal",
          }}
        />
      </Stack.Navigator>
    );
  }

  return <AuthStack />;
}

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
