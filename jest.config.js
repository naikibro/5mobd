module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest-setup-before.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-community|expo|expo-modules-core|@expo|@expo-google-fonts|react-navigation|@react-navigation|@unimodules|unimodules|firebase|@firebase|@react-native-async-storage|@expo/vector-icons|expo-font|expo-image-picker|expo-image-manipulator|expo-location|react-native-maps|expo-asset)/)",
  ],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^expo/src/winter/(.*)$": "<rootDir>/node_modules/expo/src/winter/$1",
  },
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
      },
    },
  },
};
