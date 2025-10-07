import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import LoginScreen from "../src/screens/LoginScreen";
import { AuthProvider } from "../src/context/AuthContext";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/auth");

const mockNavigation = {
  navigate: jest.fn(),
};

const MockedLoginScreen = () => (
  <AuthProvider>
    <LoginScreen navigation={mockNavigation} />
  </AuthProvider>
);

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
    const mockUser = { uid: "123", email: "test@example.com" };
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const { getByPlaceholderText, getByText } = render(<MockedLoginScreen />);

    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Mot de passe");
    const loginButton = getByText("Se connecter");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("should show error alert on login failure", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new Error("Invalid credentials")
    );

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
