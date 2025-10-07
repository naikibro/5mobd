// Mock environment variables FIRST
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-auth-domain";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project-id";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-storage-bucket";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "test-sender-id";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "test-app-id";

// Disable Expo's winter runtime
global.__DEV__ = true;

// Mock Expo's import meta registry to prevent winter runtime issues
global.__ExpoImportMetaRegistry = new Map();

// Mock the problematic Web APIs that Expo tries to polyfill
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = class TextDecoder {};
}
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = class TextEncoder {};
}
if (typeof global.TextDecoderStream === "undefined") {
  global.TextDecoderStream = class TextDecoderStream {};
}
if (typeof global.TextEncoderStream === "undefined") {
  global.TextEncoderStream = class TextEncoderStream {};
}
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
