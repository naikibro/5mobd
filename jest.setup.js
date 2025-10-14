const mockAuth = {
  currentUser: null,
};

// Mock environment variables for tests
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-project.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-api-key";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [],
    })
  ),
  addDoc: jest.fn(() => Promise.resolve({ id: "test-doc-id" })),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => false,
    })
  ),
  serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

global.alert = jest.fn();
global.Alert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

// Make mockAuth available globally for tests
global.mockAuth = mockAuth;
