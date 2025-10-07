import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

jest.mock("firebase/auth");
jest.mock("firebase/firestore");

const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });
  });

  it("should provide initial state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("should sign up user successfully", async () => {
    const mockUserCredential = {
      user: mockUser,
    };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(
      mockUserCredential
    );
    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signUp(
        "test@example.com",
        "password123",
        "Test User"
      );
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );
    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      displayName: "Test User",
    });
  });

  it("should sign in user successfully", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn("test@example.com", "password123");
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );
  });

  it("should logout user successfully", async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(signOut).toHaveBeenCalled();
  });

  it("should update user profile successfully", async () => {
    // Set currentUser in the mock
    global.mockAuth.currentUser = mockUser;

    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: mockUser.uid,
        displayName: "Old Name",
        email: mockUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateUserProfile("New Name");
    });

    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      displayName: "New Name",
    });
  });

  it("should update user email successfully", async () => {
    // Set currentUser in the mock
    global.mockAuth.currentUser = mockUser;

    (updateEmail as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateUserEmail("newemail@example.com");
    });

    expect(updateEmail).toHaveBeenCalledWith(mockUser, "newemail@example.com");
  });

  it("should update user password successfully", async () => {
    // Set currentUser in the mock
    global.mockAuth.currentUser = mockUser;

    (updatePassword as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateUserPassword("newpassword123");
    });

    expect(updatePassword).toHaveBeenCalledWith(mockUser, "newpassword123");
  });

  it("should update user photo successfully", async () => {
    // Set currentUser in the mock
    global.mockAuth.currentUser = mockUser;

    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateUserPhoto("https://example.com/photo.jpg");
    });

    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      photoURL: "https://example.com/photo.jpg",
    });
  });
});
