import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import IngredientsListScreen from "./src/screens/IngredientsListScreen";
import IngredientDetailsScreen from "./src/screens/IngredientDetailsScreen";
import { RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="IngredientsList">
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
    </NavigationContainer>
  );
}
