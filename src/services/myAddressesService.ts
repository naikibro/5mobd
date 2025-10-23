import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Address } from "../types/address";

class MyAddressesService {
  // Convert Firestore timestamp to Date
  private convertTimestamp(timestamp: any): Date {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date();
  }

  // Convert Address from Firestore
  private convertAddressFromFirestore(doc: any): Address {
    return {
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description || "",
      latitude: doc.data().latitude,
      longitude: doc.data().longitude,
      isPublic: doc.data().isPublic,
      userId: doc.data().userId,
      photos: doc.data().photos || [],
      createdAt: this.convertTimestamp(doc.data().createdAt),
      updatedAt: this.convertTimestamp(doc.data().updatedAt),
    };
  }

  // Get addresses created by a specific user
  async getUserCreatedAddresses(userId: string): Promise<Address[]> {
    const q = query(collection(db, "addresses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.convertAddressFromFirestore.bind(this));
  }

  // Get user's favorite addresses
  async getUserFavorites(userId: string): Promise<string[]> {
    const q = query(collection(db, "favorites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().addressId);
  }

  // Get user's favorite addresses with full address data
  async getUserFavoritesWithAddresses(userId: string): Promise<Address[]> {
    const favoriteIds = await this.getUserFavorites(userId);
    if (favoriteIds.length === 0) return [];

    const addresses: Address[] = [];
    for (const addressId of favoriteIds) {
      const address = await this.getAddressById(addressId);
      if (address) {
        addresses.push(address);
      }
    }
    return addresses;
  }

  // Get address by ID
  async getAddressById(id: string): Promise<Address | null> {
    const docRef = doc(db, "addresses", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return this.convertAddressFromFirestore(docSnap);
    }
    return null;
  }

  // Add address to favorites
  async addToFavorites(userId: string, addressId: string): Promise<void> {
    await addDoc(collection(db, "favorites"), {
      userId,
      addressId,
      createdAt: serverTimestamp(),
    });
  }

  // Remove address from favorites
  async removeFromFavorites(userId: string, addressId: string): Promise<void> {
    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("addressId", "==", addressId)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  // Check if address is favorite
  async isFavorite(userId: string, addressId: string): Promise<boolean> {
    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("addressId", "==", addressId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Search user's created addresses
  async searchUserAddresses(
    userId: string,
    searchQuery: string
  ): Promise<Address[]> {
    const addresses = await this.getUserCreatedAddresses(userId);

    if (!searchQuery.trim()) {
      return addresses;
    }

    const query = searchQuery.toLowerCase();
    return addresses.filter(
      (address) =>
        address.name.toLowerCase().includes(query) ||
        (address.description &&
          address.description.toLowerCase().includes(query))
    );
  }

  // Search user's favorite addresses
  async searchFavoriteAddresses(
    userId: string,
    searchQuery: string
  ): Promise<Address[]> {
    const favoriteAddresses = await this.getUserFavoritesWithAddresses(userId);

    if (!searchQuery.trim()) {
      return favoriteAddresses;
    }

    const query = searchQuery.toLowerCase();
    return favoriteAddresses.filter(
      (address) =>
        address.name.toLowerCase().includes(query) ||
        (address.description &&
          address.description.toLowerCase().includes(query))
    );
  }

  // Get combined addresses (created + favorites) for user
  async getMyAddresses(userId: string): Promise<{
    created: Address[];
    favorites: Address[];
    combined: Address[];
  }> {
    const [created, favorites] = await Promise.all([
      this.getUserCreatedAddresses(userId),
      this.getUserFavoritesWithAddresses(userId),
    ]);

    // Combine addresses, avoiding duplicates
    const combined = [...created];
    favorites.forEach((fav) => {
      if (!created.find((addr) => addr.id === fav.id)) {
        combined.push(fav);
      }
    });

    return { created, favorites, combined };
  }
}

export const myAddressesService = new MyAddressesService();
