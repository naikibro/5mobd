export interface Address {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  isPublic: boolean;
  userId: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  addressId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  rating: number; // 1-5
  comment?: string;
  photos: string[];
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface AddressWithReviews extends Address {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export type AddressVisibility = "all" | "public" | "private";
export type AddressSortBy = "name" | "createdAt" | "rating";
export type SortOrder = "asc" | "desc";
