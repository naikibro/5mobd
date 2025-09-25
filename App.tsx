import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import IngredientsListScreen from "./src/screens/IngredientsListScreen";
import IngredientDetailsScreen from "./src/screens/IngredientDetailsScreen";
import MyShoppingScreen from "./src/screens/MyShoppingScreen";
import { ShoppingListProvider } from "./src/context/ShoppingListContext";
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
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ShoppingListProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </ShoppingListProvider>
  );
}
