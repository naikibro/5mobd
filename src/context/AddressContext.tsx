import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import { Address, AddressWithReviews, Review } from "../types/address";
import { useAuth } from "./AuthContext";

interface AddressContextType {
  addresses: Address[];
  reviews: Review[];
  loading: boolean;
  error: string | null;

  // Address operations
  createAddress: (
    addressData: Omit<Address, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  getAddressById: (id: string) => Promise<Address | null>;
  getAddressesByUser: (userId: string) => Promise<Address[]>;
  getPublicAddresses: () => Promise<Address[]>;
  getAddressWithReviews: (id: string) => Promise<AddressWithReviews | null>;

  // Review operations
  createReview: (
    reviewData: Omit<Review, "id" | "createdAt">
  ) => Promise<string>;
  getReviewsByAddress: (addressId: string) => Promise<Review[]>;

  // Photo operations
  uploadPhoto: (file: Blob, path: string) => Promise<string>;
  deletePhoto: (url: string) => Promise<void>;

  // Search and filter
  searchAddresses: (
    query: string,
    visibility?: "all" | "public" | "private"
  ) => Promise<Address[]>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({
  children,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Convert Firestore timestamp to Date
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date();
  };

  // Convert Address from Firestore
  const convertAddressFromFirestore = (doc: any): Address => ({
    id: doc.id,
    name: doc.data().name,
    description: doc.data().description || "",
    latitude: doc.data().latitude,
    longitude: doc.data().longitude,
    isPublic: doc.data().isPublic,
    userId: doc.data().userId,
    photos: doc.data().photos || [],
    createdAt: convertTimestamp(doc.data().createdAt),
    updatedAt: convertTimestamp(doc.data().updatedAt),
  });

  // Convert Review from Firestore
  const convertReviewFromFirestore = (doc: any): Review => ({
    id: doc.id,
    addressId: doc.data().addressId,
    userId: doc.data().userId,
    userDisplayName: doc.data().userDisplayName,
    userPhotoURL: doc.data().userPhotoURL,
    rating: doc.data().rating,
    comment: doc.data().comment || "",
    photos: doc.data().photos || [],
    createdAt: convertTimestamp(doc.data().createdAt),
  });

  // Address operations
  const createAddress = async (
    addressData: Omit<Address, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const docRef = await addDoc(collection(db, "addresses"), {
        ...addressData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (
    id: string,
    updates: Partial<Address>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const addressRef = doc(db, "addresses", id);
      await updateDoc(addressRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get address to delete associated photos
      const address = await getAddressById(id);
      if (address) {
        // Delete photos from storage
        for (const photoUrl of address.photos) {
          try {
            await deletePhoto(photoUrl);
          } catch (err) {
            console.warn("Failed to delete photo:", err);
          }
        }
      }

      // Delete address document
      await deleteDoc(doc(db, "addresses", id));

      // Delete associated reviews
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("addressId", "==", id)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const deletePromises = reviewsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAddressById = async (id: string): Promise<Address | null> => {
    try {
      const docRef = doc(db, "addresses", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertAddressFromFirestore(docSnap);
      }
      return null;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getAddressesByUser = async (userId: string): Promise<Address[]> => {
    try {
      const q = query(
        collection(db, "addresses"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(convertAddressFromFirestore);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getPublicAddresses = async (): Promise<Address[]> => {
    try {
      const q = query(
        collection(db, "addresses"),
        where("isPublic", "==", true)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(convertAddressFromFirestore);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getAddressWithReviews = async (
    id: string
  ): Promise<AddressWithReviews | null> => {
    try {
      const address = await getAddressById(id);
      if (!address) return null;

      const addressReviews = await getReviewsByAddress(id);
      const averageRating =
        addressReviews.length > 0
          ? addressReviews.reduce((sum, review) => sum + review.rating, 0) /
            addressReviews.length
          : 0;

      return {
        ...address,
        reviews: addressReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: addressReviews.length,
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Review operations
  const createReview = async (
    reviewData: Omit<Review, "id" | "createdAt">
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const docRef = await addDoc(collection(db, "reviews"), {
        ...reviewData,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getReviewsByAddress = async (addressId: string): Promise<Review[]> => {
    try {
      const q = query(
        collection(db, "reviews"),
        where("addressId", "==", addressId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(convertReviewFromFirestore);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Photo operations
  const uploadPhoto = async (file: Blob, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, path);

      const snapshot = await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePhoto = async (url: string): Promise<void> => {
    try {
      const photoRef = ref(storage, url);
      await deleteObject(photoRef);
    } catch (err: any) {
      console.warn("Failed to delete photo:", err);
    }
  };

  // Search and filter
  const searchAddresses = async (
    searchQuery: string,
    visibility: "all" | "public" | "private" = "all"
  ): Promise<Address[]> => {
    try {
      let q = query(collection(db, "addresses"));

      if (visibility === "public") {
        q = query(q, where("isPublic", "==", true));
      } else if (visibility === "private" && user) {
        q = query(q, where("userId", "==", user.uid));
      }

      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(convertAddressFromFirestore);

      // Client-side filtering for name/description search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        results = results.filter(
          (address) =>
            address.name.toLowerCase().includes(query) ||
            (address.description &&
              address.description.toLowerCase().includes(query))
        );
      }

      return results.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value: AddressContextType = {
    addresses,
    reviews,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressById,
    getAddressesByUser,
    getPublicAddresses,
    getAddressWithReviews,
    createReview,
    getReviewsByAddress,
    uploadPhoto,
    deletePhoto,
    searchAddresses,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};
