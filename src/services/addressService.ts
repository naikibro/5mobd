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
import { db, storage } from "../../firebaseConfig";
import { Address, AddressWithReviews, Review } from "../types/address";

/* TODO : add unit tests for this service */
class AddressService {
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

  // Convert Review from Firestore
  private convertReviewFromFirestore(doc: any): Review {
    return {
      id: doc.id,
      addressId: doc.data().addressId,
      userId: doc.data().userId,
      userDisplayName: doc.data().userDisplayName,
      userPhotoURL: doc.data().userPhotoURL,
      rating: doc.data().rating,
      comment: doc.data().comment || "",
      photos: doc.data().photos || [],
      createdAt: this.convertTimestamp(doc.data().createdAt),
    };
  }

  // Address operations
  async createAddress(
    addressData: Omit<Address, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "addresses"), {
      ...addressData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<void> {
    const addressRef = doc(db, "addresses", id);
    await updateDoc(addressRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteAddress(id: string): Promise<void> {
    // Get address to delete associated photos
    const address = await this.getAddressById(id);
    if (address) {
      // Delete photos from storage
      for (const photoUrl of address.photos) {
        try {
          await this.deletePhoto(photoUrl);
        } catch (err) {
          // eslint-disable-next-line no-console
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
  }

  async getAddressById(id: string): Promise<Address | null> {
    const docRef = doc(db, "addresses", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return this.convertAddressFromFirestore(docSnap);
    }
    return null;
  }

  async getAddressesByUser(userId: string): Promise<Address[]> {
    const q = query(collection(db, "addresses"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.convertAddressFromFirestore.bind(this));
  }

  async getPublicAddresses(): Promise<Address[]> {
    const q = query(collection(db, "addresses"), where("isPublic", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.convertAddressFromFirestore.bind(this));
  }

  // Get addresses for map view: public addresses + user's private addresses
  async getMapAddresses(userId?: string): Promise<Address[]> {
    if (!userId) {
      // If no user, just return public addresses
      return this.getPublicAddresses();
    }

    // Get both public addresses and user's private addresses
    const [publicAddresses, userAddresses] = await Promise.all([
      this.getPublicAddresses(),
      this.getAddressesByUser(userId),
    ]);

    // Combine and remove duplicates
    const addressMap = new Map<string, Address>();

    publicAddresses.forEach((addr) => addressMap.set(addr.id, addr));
    userAddresses.forEach((addr) => addressMap.set(addr.id, addr));

    return Array.from(addressMap.values());
  }

  async getAllAddresses(): Promise<Address[]> {
    const querySnapshot = await getDocs(collection(db, "addresses"));
    return querySnapshot.docs.map(this.convertAddressFromFirestore.bind(this));
  }

  async getAddressWithReviews(id: string): Promise<AddressWithReviews | null> {
    const address = await this.getAddressById(id);
    if (!address) return null;

    const addressReviews = await this.getReviewsByAddress(id);
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
  }

  // Review operations
  async createReview(
    reviewData: Omit<Review, "id" | "createdAt">
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getReviewsByAddress(addressId: string): Promise<Review[]> {
    const q = query(
      collection(db, "reviews"),
      where("addressId", "==", addressId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.convertReviewFromFirestore.bind(this));
  }

  // Photo operations
  async uploadPhoto(file: Blob, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  async deletePhoto(url: string): Promise<void> {
    const photoRef = ref(storage, url);
    await deleteObject(photoRef);
  }

  // Favorites operations
  async addToFavorites(userId: string, addressId: string): Promise<void> {
    await addDoc(collection(db, "favorites"), {
      userId,
      addressId,
      createdAt: serverTimestamp(),
    });
  }

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

  async getUserFavorites(userId: string): Promise<string[]> {
    const q = query(collection(db, "favorites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().addressId);
  }

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

  async isFavorite(userId: string, addressId: string): Promise<boolean> {
    const q = query(
      collection(db, "favorites"),
      where("userId", "==", userId),
      where("addressId", "==", addressId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Search and filter
  async searchAddresses(
    searchQuery: string,
    visibility: "all" | "public" | "private" = "all",
    userId?: string,
    userLocation?: { latitude: number; longitude: number },
    maxDistanceKm: number = 30
  ): Promise<Address[]> {
    let q = query(collection(db, "addresses"));

    if (visibility === "public") {
      q = query(q, where("isPublic", "==", true));
    } else if (visibility === "private" && userId) {
      q = query(q, where("userId", "==", userId));
    } else if (visibility === "all" && userId) {
      // When searching "all" with userId, only show user's addresses
      q = query(q, where("userId", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    let results = querySnapshot.docs.map(
      this.convertAddressFromFirestore.bind(this)
    );

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

    // Filter by distance if user location is provided
    if (userLocation) {
      results = this.filterByDistance(results, userLocation, maxDistanceKm);
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Helper method to filter addresses by distance
  private filterByDistance(
    addresses: Address[],
    userLocation: { latitude: number; longitude: number },
    maxDistanceKm: number
  ): Address[] {
    console.log(
      `Filtering ${addresses.length} addresses within ${maxDistanceKm}km of (${userLocation.latitude}, ${userLocation.longitude})`
    );

    const filtered = addresses.filter((address) => {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        address.latitude,
        address.longitude
      );
      console.log(
        `Address "${address.name}" at (${address.latitude}, ${
          address.longitude
        }) is ${distance.toFixed(2)}km away`
      );
      return distance <= maxDistanceKm;
    });

    console.log(
      `Filtered to ${filtered.length} addresses within ${maxDistanceKm}km`
    );
    return filtered;
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const addressService = new AddressService();
