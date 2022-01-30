module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/test/unit/tsconfig.json",
    },
  },
  testMatch: ["<rootDir>/test/unit/**/*.test.ts"],
  testEnvironment: "node",
  testTimeout: 10000,
  collectCoverage: true,
  coveragePathIgnorePatterns: ["<rootDir>/test/", "<rootDir>/node_modules/"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
