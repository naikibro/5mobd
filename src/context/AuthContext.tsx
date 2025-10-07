import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUserPhoto: (photoUrl: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(
        doc(db, "userProfiles", auth.currentUser.uid)
      );
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Create user profile if it doesn't exist
        const newProfile: UserProfile = {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || "",
          email: auth.currentUser.email || "",
          ...(auth.currentUser.photoURL && {
            photoURL: auth.currentUser.photoURL,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, "userProfiles", auth.currentUser.uid), newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      setUser(userCredential.user);
      await loadUserProfile();
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser });
      await loadUserProfile();
    }
  };

  const updateUserEmail = async (email: string) => {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, email);
      setUser({ ...auth.currentUser });
      await loadUserProfile();
    }
  };

  const updateUserPassword = async (password: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, password);
    }
  };

  const updateUserPhoto = async (photoUrl: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: photoUrl });
      setUser({ ...auth.currentUser });
      await loadUserProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        logout,
        updateUserProfile,
        updateUserEmail,
        updateUserPassword,
        updateUserPhoto,
        loadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
