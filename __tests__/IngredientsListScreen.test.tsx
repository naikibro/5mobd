import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import IngredientsListScreen from "../src/screens/IngredientsListScreen";
import IngredientDetailsScreen from "../src/screens/IngredientDetailsScreen";
import { ShoppingListProvider } from "../src/context/ShoppingListContext";
import { AuthProvider } from "../src/context/AuthContext";
import { getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/firestore");
jest.mock("firebase/auth");

const Stack = createNativeStackNavigator();

const MockedNavigator = () => (
  <NavigationContainer>
    <AuthProvider>
      <ShoppingListProvider>
        <Stack.Navigator>
          <Stack.Screen
            name="IngredientsList"
            component={IngredientsListScreen}
          />
          <Stack.Screen
            name="IngredientDetails"
            component={IngredientDetailsScreen as any}
          />
        </Stack.Navigator>
      </ShoppingListProvider>
    </AuthProvider>
  </NavigationContainer>
);

describe("IngredientsListScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: "test-user", email: "test@example.com" });
      return jest.fn();
    });
  });

  it("should display loading indicator while fetching ingredients", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: jest.fn(),
    });

    const { getByText } = render(<MockedNavigator />);

    await waitFor(
      () => {
        expect(getByText("Chargement des ingrédients...")).toBeTruthy();
      },
      { timeout: 100 }
    );
  });

  it("should render ingredients list screen", async () => {
    const mockIngredients = [
      {
        id: "1",
        name: "Tomato",
        description: "Fresh tomato",
        price: 2.5,
        weight: 200,
        origin: "France",
        category: "Vegetables",
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: any) => {
        mockIngredients.forEach((ingredient) => {
          callback({
            id: ingredient.id,
            data: () => ingredient,
          });
        });
      },
    });

    const { findByText } = render(<MockedNavigator />);

    await waitFor(async () => {
      const tomato = await findByText("Tomato");
      expect(tomato).toBeTruthy();
    });
  });

  it("should display ingredient price and category", async () => {
    const mockIngredients = [
      {
        id: "1",
        name: "Carrot",
        description: "Fresh carrot",
        price: 1.5,
        weight: 150,
        origin: "Belgium",
        category: "Vegetables",
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: any) => {
        mockIngredients.forEach((ingredient) => {
          callback({
            id: ingredient.id,
            data: () => ingredient,
          });
        });
      },
    });

    const { findByText } = render(<MockedNavigator />);

    await waitFor(async () => {
      expect(await findByText("Carrot")).toBeTruthy();
      expect(await findByText("€1.50")).toBeTruthy();
      expect(await findByText("Vegetables")).toBeTruthy();
    });
  });
});
