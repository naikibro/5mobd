const mockAuth = {
  currentUser: null,
};

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
