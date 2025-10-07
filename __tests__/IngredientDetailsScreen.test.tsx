import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import IngredientDetailsScreen from "../src/screens/IngredientDetailsScreen";
import { ShoppingListProvider } from "../src/context/ShoppingListContext";
import { AuthProvider } from "../src/context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/auth");

const mockRoute = {
  params: {
    ingredient: {
      id: 1,
      name: "Tomato",
      description: "Fresh organic tomato",
      price: 2.5,
      weight: 200,
      origin: "France",
      category: "Vegetables",
    },
  },
  key: "test-key",
  name: "IngredientDetails" as const,
};

const MockedIngredientDetailsScreen = ({ route = mockRoute }: any) => (
  <AuthProvider>
    <ShoppingListProvider>
      <IngredientDetailsScreen route={route} />
    </ShoppingListProvider>
  </AuthProvider>
);

describe("IngredientDetailsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: "test-user", email: "test@example.com" });
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render ingredient details correctly", () => {
    const { getByText } = render(<MockedIngredientDetailsScreen />);

    expect(getByText("Tomato")).toBeTruthy();
    expect(getByText("€2.50")).toBeTruthy();
    expect(getByText("Fresh organic tomato")).toBeTruthy();
    expect(getByText("Vegetables")).toBeTruthy();
    expect(getByText("France")).toBeTruthy();
    expect(getByText("200g")).toBeTruthy();
  });

  it("should display price per kg correctly", () => {
    const { getByText } = render(<MockedIngredientDetailsScreen />);

    // 2.5 / (200/1000) = 12.50 per kg
    expect(getByText("€12.50/kg")).toBeTruthy();
  });

  it("should show add to shopping list button when item not in list", () => {
    const { getByText } = render(<MockedIngredientDetailsScreen />);

    const addButton = getByText("Ajouter à ma liste");
    expect(addButton).toBeTruthy();
  });

  it("should add ingredient to shopping list when button is pressed", async () => {
    const { getByTestId } = render(<MockedIngredientDetailsScreen />);

    const addButton = getByTestId("add-to-shopping-list-button");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Ajouté !",
        "Tomato a été ajouté à votre liste de courses",
        [{ text: "OK" }]
      );
    });
  });

  it("should show disabled state when item is already in shopping list", async () => {
    const { getByTestId, getByText, rerender } = render(
      <MockedIngredientDetailsScreen />
    );

    // First, add the item
    const addButton = getByTestId("add-to-shopping-list-button");
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Re-render to see the updated state
    rerender(<MockedIngredientDetailsScreen route={mockRoute} />);

    // Should now show "already in list" text
    await waitFor(() => {
      expect(getByText("Déjà dans la liste")).toBeTruthy();
    });
  });

  it("should display all ingredient information sections", () => {
    const { getByText } = render(<MockedIngredientDetailsScreen />);

    expect(getByText("Description")).toBeTruthy();
    expect(getByText("Informations")).toBeTruthy();
    expect(getByText("Prix")).toBeTruthy();
  });

  it("should calculate and display price details correctly", () => {
    const customRoute = {
      ...mockRoute,
      params: {
        ingredient: {
          ...mockRoute.params.ingredient,
          price: 5.0,
          weight: 500,
        },
      },
    };

    const { getByText } = render(
      <MockedIngredientDetailsScreen route={customRoute} />
    );

    expect(getByText("€5.00 pour 500g")).toBeTruthy();
    expect(getByText("€10.00/kg")).toBeTruthy();
  });
});
