module.exports = {
  setupFiles: [],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  globalSetup: "./dist/global-setup",
  globalTeardown: "./dist/global-teardown",
  transformIgnorePatterns: ["\\.pnp\\.[^\\/]+$", "/node_modules/(?!rc-util)"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.css$": "./css-transform",
  },
  moduleNameMapper: {
    "^@gux/react-screenshot-test$": "<rootDir>/src/index.ts",
  },
};
