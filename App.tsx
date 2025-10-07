import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import IngredientsListScreen from "./src/screens/IngredientsListScreen";
import IngredientDetailsScreen from "./src/screens/IngredientDetailsScreen";
import MyShoppingScreen from "./src/screens/MyShoppingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { ShoppingListProvider } from "./src/context/ShoppingListContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function IngredientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="IngredientsList"
        component={IngredientsListScreen}
        options={{ title: "Liste d'ingrédients" }}
      />
      <Stack.Screen
        name="IngredientDetails"
        component={IngredientDetailsScreen}
        options={{ title: "Détails" }}
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

          if (route.name === "Ingredients") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "MyShopping") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "list-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2ecc71",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Ingredients"
        component={IngredientsStack}
        options={{ title: "Ingrédients", headerShown: false }}
      />
      <Tab.Screen
        name="MyShopping"
        component={MyShoppingScreen}
        options={{ title: "Mes courses" }}
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
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

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
    <AuthProvider>
      <ShoppingListProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ShoppingListProvider>
    </AuthProvider>
  );
}
