import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* TODO : add unit tests for this service */

class AuthService {
  private authStateUnsubscribe: (() => void) | null = null;

  // Initialize auth state listener
  onAuthStateChanged(callback: (user: User | null) => void) {
    this.authStateUnsubscribe = onAuthStateChanged(auth, callback);
    return () => {
      if (this.authStateUnsubscribe) {
        this.authStateUnsubscribe();
        this.authStateUnsubscribe = null;
      }
    };
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Sign up with email and password
  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      await this.createUserProfile(userCredential.user);
    }
    return userCredential.user;
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  }

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  // Update user profile
  async updateUserProfile(displayName: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updateProfile(auth.currentUser, { displayName });
    await this.updateUserProfileDoc(auth.currentUser.uid, { displayName });
  }

  // Update user email
  async updateUserEmail(email: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updateEmail(auth.currentUser, email);
    await this.updateUserProfileDoc(auth.currentUser.uid, { email });
  }

  // Update user password
  async updateUserPassword(password: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updatePassword(auth.currentUser, password);
  }

  // Update user photo
  async updateUserPhoto(photoUrl: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updateProfile(auth.currentUser, { photoURL: photoUrl });
    await this.updateUserProfileDoc(auth.currentUser.uid, {
      photoURL: photoUrl,
    });
  }

  // Load user profile from Firestore
  async loadUserProfile(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;

    try {
      const userDoc = await getDoc(
        doc(db, "userProfiles", auth.currentUser.uid)
      );
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        // Create user profile if it doesn't exist
        return await this.createUserProfile(auth.currentUser);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      throw error;
    }
  }

  // Create user profile in Firestore
  private async createUserProfile(user: User): Promise<UserProfile> {
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      ...(user.photoURL && { photoURL: user.photoURL }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "userProfiles", user.uid), newProfile);
    return newProfile;
  }

  // Update user profile document in Firestore
  private async updateUserProfileDoc(
    uid: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    await setDoc(
      doc(db, "userProfiles", uid),
      { ...updates, updatedAt: new Date() },
      { merge: true }
    );
  }
}

export const authService = new AuthService();
