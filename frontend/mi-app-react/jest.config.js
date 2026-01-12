export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  collectCoverage: true,

  coverageReporters: ["json-summary", "text"],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  transform: {
    "^.+\\.(js|jsx)$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },

  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  moduleFileExtensions: ["js", "jsx", "json"],

  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/**/*.test.{js,jsx}",
    "!src/**/__tests__/**",
  ],
};
