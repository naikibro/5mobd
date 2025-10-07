import { act, renderHook } from "@testing-library/react-native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React from "react";
import { AddressProvider, useAddress } from "../src/context/AddressContext";
import { AuthProvider } from "../src/context/AuthContext";

jest.mock("firebase/firestore");

const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <AddressProvider>{children}</AddressProvider>
  </AuthProvider>
);

describe("AddressContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should provide initial state", () => {
    const { result } = renderHook(() => useAddress(), { wrapper });

    expect(result.current.addresses).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should add address successfully", async () => {
    const mockAddress = {
      name: "Test Restaurant",
      description: "A great place to eat",
      latitude: 48.8566,
      longitude: 2.3522,
      isPublic: true,
      userId: mockUser.uid,
      photos: [],
    };

    const mockDocRef = { id: "test-address-id" };
    (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
    (collection as jest.Mock).mockReturnValue("mock-collection");

    const { result } = renderHook(() => useAddress(), { wrapper });

    await act(async () => {
      await result.current.createAddress(mockAddress);
    });

    expect(addDoc).toHaveBeenCalledWith(
      "mock-collection",
      expect.objectContaining({
        ...mockAddress,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });

  it("should get public addresses successfully", async () => {
    const mockAddresses = [
      {
        id: "1",
        name: "Public Restaurant",
        description: "Public place",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user1",
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockAddresses.map((address) => ({
        id: address.id,
        data: () => address,
      })),
    });

    const { result } = renderHook(() => useAddress(), { wrapper });

    let addresses: any[] = [];
    await act(async () => {
      addresses = await result.current.getPublicAddresses();
    });

    expect(addresses).toHaveLength(1);
    expect(addresses[0].name).toBe("Public Restaurant");
  });

  it("should get addresses by user successfully", async () => {
    const mockAddresses = [
      {
        id: "1",
        name: "User Restaurant",
        description: "User's place",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: false,
        userId: mockUser.uid,
        userName: mockUser.displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockAddresses.map((address) => ({
        id: address.id,
        data: () => address,
      })),
    });

    const { result } = renderHook(() => useAddress(), { wrapper });

    let addresses: any[] = [];
    await act(async () => {
      addresses = await result.current.getAddressesByUser(mockUser.uid);
    });

    expect(addresses).toHaveLength(1);
    expect(addresses[0].name).toBe("User Restaurant");
  });

  it("should update address successfully", async () => {
    const mockAddress = {
      id: "test-id",
      name: "Updated Restaurant",
      description: "Updated description",
      latitude: 48.8566,
      longitude: 2.3522,
      isPublic: true,
      userId: mockUser.uid,
      userName: mockUser.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDocRef = { id: "test-id" };
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAddress(), { wrapper });

    await act(async () => {
      await result.current.updateAddress(mockAddress.id, mockAddress);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        name: mockAddress.name,
        description: mockAddress.description,
        latitude: mockAddress.latitude,
        longitude: mockAddress.longitude,
        isPublic: mockAddress.isPublic,
        userId: mockAddress.userId,
        userName: mockAddress.userName,
        createdAt: mockAddress.createdAt,
        updatedAt: expect.any(Date),
      })
    );
  });

  it("should delete address successfully", async () => {
    const mockDocRef = { id: "test-address-id" };
    (doc as jest.Mock).mockReturnValue(mockDocRef);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    // Mock getDocs for reviews query
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [], // No reviews to delete
    });

    const { result } = renderHook(() => useAddress(), { wrapper });

    await act(async () => {
      await result.current.deleteAddress("test-address-id");
    });

    expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
  });

  it("should search addresses successfully", async () => {
    const mockAddresses = [
      {
        id: "1",
        name: "Searchable Restaurant",
        description: "Great food",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user1",
        userName: "User 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockAddresses.map((address) => ({
        id: address.id,
        data: () => address,
      })),
    });

    const { result } = renderHook(() => useAddress(), { wrapper });

    let addresses: any[] = [];
    await act(async () => {
      addresses = await result.current.searchAddresses("Restaurant", "public");
    });

    expect(addresses).toHaveLength(1);
    expect(addresses[0].name).toBe("Searchable Restaurant");
  });

  it("should add review successfully", async () => {
    const mockReview = {
      rating: 5,
      comment: "Excellent!",
      userId: mockUser.uid,
      userDisplayName: mockUser.displayName,
    };

    const mockDocRef = { id: "test-review-id" };
    (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

    const { result } = renderHook(() => useAddress(), { wrapper });

    await act(async () => {
      await result.current.createReview({
        addressId: "test-address-id",
        ...mockReview,
        photos: [],
      });
    });

    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        rating: mockReview.rating,
        comment: mockReview.comment,
        userId: mockReview.userId,
        userDisplayName: mockReview.userDisplayName,
        addressId: "test-address-id",
        photos: [],
        createdAt: expect.any(Date),
      })
    );
  });
});
