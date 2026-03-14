/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/lib", "<rootDir>/hooks", "<rootDir>/components"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleNameMapper: {
    "^expo-secure-store$": "<rootDir>/__mocks__/expo-secure-store.ts",
    "^react-native-quick-crypto$":
      "<rootDir>/__mocks__/react-native-quick-crypto.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
};
