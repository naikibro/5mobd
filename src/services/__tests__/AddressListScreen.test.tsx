import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddressListScreen from "../../screens/AddressListScreen";
import AddressDetailsScreen from "../../screens/AddressDetailsScreen";
import { getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

jest.mock("firebase/firestore");
jest.mock("firebase/auth");

// Create a mock store that can hold state
let mockAddresses: any[] = [];
let mockLoading = false;
let mockIsPolling = false;

const mockFetchPublicAddresses = jest.fn();
const mockSearchAddresses = jest.fn();

jest.mock("../../stores/addressStore", () => ({
  useAddressStore: () => ({
    fetchPublicAddresses: mockFetchPublicAddresses,
    searchAddresses: mockSearchAddresses,
    loading: mockLoading,
    addresses: mockAddresses,
    isPolling: mockIsPolling,
  }),
}));

const Stack = createNativeStackNavigator();

const MockedNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="AddressList" component={AddressListScreen} />
      <Stack.Screen
        name="AddressDetails"
        component={AddressDetailsScreen as any}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

// Mock console.error
console.error = jest.fn();

describe("AddressListScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockAddresses = [];
    mockLoading = false;
    mockIsPolling = false;

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: "test-user", email: "test@example.com" });
      return jest.fn();
    });
  });

  it("should display empty state when no addresses", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [],
    });

    const { findByText } = render(<MockedNavigator />);

    await waitFor(async () => {
      expect(await findByText("Aucune adresse publique")).toBeTruthy();
    });
  });

  it("should render addresses list screen", async () => {
    const testAddresses = [
      {
        id: "1",
        name: "Restaurant Le Bistrot",
        description: "Excellent restaurant français",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user1",
        userName: "John Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [],
      },
    ];

    // Set the mock addresses in the store
    mockAddresses = testAddresses;

    (getDocs as jest.Mock).mockResolvedValue({
      docs: testAddresses.map((address) => ({
        id: address.id,
        data: () => address,
      })),
    });

    const { findByText } = render(<MockedNavigator />);

    await waitFor(async () => {
      const restaurant = await findByText("Restaurant Le Bistrot");
      expect(restaurant).toBeTruthy();
    });
  });

  it("should display address description and coordinates", async () => {
    const testAddresses = [
      {
        id: "1",
        name: "Café Central",
        description: "Café avec terrasse",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user1",
        userName: "Jane Doe",
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [],
      },
    ];

    // Set the mock addresses in the store
    mockAddresses = testAddresses;

    (getDocs as jest.Mock).mockResolvedValue({
      docs: testAddresses.map((address) => ({
        id: address.id,
        data: () => address,
      })),
    });

    const { findByText } = render(<MockedNavigator />);

    await waitFor(async () => {
      expect(await findByText("Café Central")).toBeTruthy();
      expect(await findByText("Café avec terrasse")).toBeTruthy();
      expect(await findByText("48.8566, 2.3522")).toBeTruthy();
    });
  });
});
