import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import LoginScreen from "../../screens/LoginScreen";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/auth");
jest.mock("../authService", () => ({
  authService: {
    signIn: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
}));

const mockSignIn = jest.fn();
jest.mock("../../stores/authStore", () => ({
  useAuthStore: () => ({
    signIn: mockSignIn,
    loading: false,
    error: null,
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const MockedLoginScreen = () => <LoginScreen navigation={mockNavigation} />;

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });
  });

  it("should render login screen", () => {
    const { getByText, getByPlaceholderText } = render(<MockedLoginScreen />);

    expect(getByText("Connexion")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Mot de passe")).toBeTruthy();
    expect(getByText("Se connecter")).toBeTruthy();
  });

  it("should display error if email field is empty", async () => {
    const { getByText } = render(<MockedLoginScreen />);

    const loginButton = getByText("Se connecter");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur",
        "Veuillez remplir tous les champs"
      );
    });
  });

  it("should call signInWithEmailAndPassword when login button is pressed with valid data", async () => {
    mockSignIn.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<MockedLoginScreen />);

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Mot de passe");
    const loginButton = getByText("Se connecter");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });
  });

  it("should show error alert on login failure", async () => {
    mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

    const { getByPlaceholderText, getByText } = render(<MockedLoginScreen />);

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Mot de passe");
    const loginButton = getByText("Se connecter");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "wrongpassword");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur de connexion",
        "Invalid credentials"
      );
    });
  });

  it("should navigate to Signup screen when signup link is pressed", () => {
    const { getByText } = render(<MockedLoginScreen />);

    const signupLink = getByText("S'inscrire");
    fireEvent.press(signupLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Signup");
  });
});
