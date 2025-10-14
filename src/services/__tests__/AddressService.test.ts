import { addressService } from "../addressService";

// Mock firebaseConfig to prevent Firebase initialization
jest.mock("../../../firebaseConfig", () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock Firebase modules
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  deleteObject: jest.fn(),
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

describe("AddressService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAddress", () => {
    it("should create a new address", async () => {
      const addressData = {
        name: "Test Restaurant",
        description: "A great place to eat",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
      };

      const { addDoc } = require("firebase/firestore");
      addDoc.mockResolvedValueOnce({ id: "address123" });

      const result = await addressService.createAddress(addressData);

      expect(result).toBe("address123");
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe("updateAddress", () => {
    it("should update an existing address", async () => {
      const updates = {
        name: "Updated Restaurant",
        description: "Updated description",
      };

      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockResolvedValueOnce(undefined);

      await addressService.updateAddress("address123", updates);

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe("deleteAddress", () => {
    it("should delete an address and its photos", async () => {
      const mockAddress = {
        id: "address123",
        name: "Test Restaurant",
        description: "A great place to eat",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: ["photo1.jpg", "photo2.jpg"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getDoc, deleteDoc, getDocs } = require("firebase/firestore");
      const { deleteObject } = require("firebase/storage");

      // Mock getAddressById
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: "address123",
        data: () => mockAddress,
      });

      // Mock deletePhoto calls
      deleteObject.mockResolvedValue(undefined);

      // Mock deleteDoc for address
      deleteDoc.mockResolvedValue(undefined);

      // Mock reviews query
      getDocs.mockResolvedValueOnce({
        docs: [{ ref: "review1" }, { ref: "review2" }],
      });

      await addressService.deleteAddress("address123");

      expect(deleteObject).toHaveBeenCalledTimes(2);
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe("getAddressById", () => {
    it("should return an address when it exists", async () => {
      const mockAddressData = {
        name: "Test Restaurant",
        description: "A great place to eat",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDoc } = require("firebase/firestore");
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: "address123",
        data: () => mockAddressData,
      });

      const result = await addressService.getAddressById("address123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("address123");
      expect(result?.name).toBe("Test Restaurant");
    });

    it("should return null when address does not exist", async () => {
      const { getDoc } = require("firebase/firestore");
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await addressService.getAddressById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getAddressesByUser", () => {
    it("should return addresses for a specific user", async () => {
      const mockAddressData = {
        name: "User Restaurant",
        description: "User's restaurant",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: false,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "address123",
            data: () => mockAddressData,
          },
        ],
      });

      const result = await addressService.getAddressesByUser("user123");

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("user123");
    });
  });

  describe("getPublicAddresses", () => {
    it("should return only public addresses", async () => {
      const mockAddressData = {
        name: "Public Restaurant",
        description: "Public restaurant",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "address123",
            data: () => mockAddressData,
          },
        ],
      });

      const result = await addressService.getPublicAddresses();

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });
  });

  describe("getAllAddresses", () => {
    it("should return all addresses", async () => {
      const mockAddressData = {
        name: "All Restaurant",
        description: "All restaurant",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "address123",
            data: () => mockAddressData,
          },
        ],
      });

      const result = await addressService.getAllAddresses();

      expect(result).toHaveLength(1);
    });
  });

  describe("getAddressWithReviews", () => {
    it("should return address with reviews and average rating", async () => {
      const mockAddressData = {
        name: "Restaurant with Reviews",
        description: "Restaurant with reviews",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const mockReviewData = {
        addressId: "address123",
        userId: "user456",
        userDisplayName: "John Doe",
        userPhotoURL: "photo.jpg",
        rating: 4,
        comment: "Great food!",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-03") },
      };

      const { getDoc, getDocs } = require("firebase/firestore");

      // Mock getAddressById
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: "address123",
        data: () => mockAddressData,
      });

      // Mock getReviewsByAddress
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "review123",
            data: () => mockReviewData,
          },
          {
            id: "review456",
            data: () => ({ ...mockReviewData, rating: 5 }),
          },
        ],
      });

      const result = await addressService.getAddressWithReviews("address123");

      expect(result).toBeDefined();
      expect(result?.reviews).toHaveLength(2);
      expect(result?.averageRating).toBe(4.5);
      expect(result?.reviewCount).toBe(2);
    });

    it("should return null when address does not exist", async () => {
      const { getDoc } = require("firebase/firestore");
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await addressService.getAddressWithReviews("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const reviewData = {
        addressId: "address123",
        userId: "user456",
        userDisplayName: "John Doe",
        userPhotoURL: "photo.jpg",
        rating: 4,
        comment: "Great food!",
        photos: [],
      };

      const { addDoc } = require("firebase/firestore");
      addDoc.mockResolvedValueOnce({ id: "review123" });

      const result = await addressService.createReview(reviewData);

      expect(result).toBe("review123");
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe("getReviewsByAddress", () => {
    it("should return reviews for a specific address", async () => {
      const mockReviewData = {
        addressId: "address123",
        userId: "user456",
        userDisplayName: "John Doe",
        userPhotoURL: "photo.jpg",
        rating: 4,
        comment: "Great food!",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-03") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "review123",
            data: () => mockReviewData,
          },
        ],
      });

      const result = await addressService.getReviewsByAddress("address123");

      expect(result).toHaveLength(1);
      expect(result[0].addressId).toBe("address123");
    });
  });

  describe("uploadPhoto", () => {
    it("should upload a photo and return download URL", async () => {
      const mockFile = new Blob(["test"], { type: "image/jpeg" });
      const mockPath = "photos/test.jpg";

      const { uploadBytes, getDownloadURL } = require("firebase/storage");
      uploadBytes.mockResolvedValueOnce({
        ref: "mock-ref",
      });
      getDownloadURL.mockResolvedValueOnce("https://example.com/photo.jpg");

      const result = await addressService.uploadPhoto(mockFile, mockPath);

      expect(result).toBe("https://example.com/photo.jpg");
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalledWith("mock-ref");
    });
  });

  describe("deletePhoto", () => {
    it("should delete a photo from storage", async () => {
      const photoUrl = "https://example.com/photo.jpg";

      const { deleteObject } = require("firebase/storage");
      deleteObject.mockResolvedValueOnce(undefined);

      await addressService.deletePhoto(photoUrl);

      expect(deleteObject).toHaveBeenCalled();
    });
  });

  describe("searchAddresses", () => {
    it("should search addresses by query", async () => {
      const mockAddressData = {
        name: "Pizza Restaurant",
        description: "Best pizza in town",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "address123",
            data: () => mockAddressData,
          },
          {
            id: "address456",
            data: () => ({
              ...mockAddressData,
              name: "Burger Place",
              description: "Best burgers in town",
            }),
          },
        ],
      });

      const result = await addressService.searchAddresses("pizza");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Pizza Restaurant");
    });

    it("should filter by visibility", async () => {
      const mockAddressData = {
        name: "Public Restaurant",
        description: "Public restaurant",
        latitude: 48.8566,
        longitude: 2.3522,
        isPublic: true,
        userId: "user123",
        photos: [],
        createdAt: { toDate: () => new Date("2023-01-01") },
        updatedAt: { toDate: () => new Date("2023-01-02") },
      };

      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "address123",
            data: () => mockAddressData,
          },
        ],
      });

      const result = await addressService.searchAddresses("", "public");

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });

    it("should return empty array for no matches", async () => {
      const { getDocs } = require("firebase/firestore");
      getDocs.mockResolvedValueOnce({
        docs: [],
      });

      const result = await addressService.searchAddresses("nonexistent");

      expect(result).toHaveLength(0);
    });
  });
});
