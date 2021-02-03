module.exports = {
  setupFiles: [],
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  transformIgnorePatterns: ["\\.pnp\\.[^\\/]+$", "/node_modules/(?!rc-util)"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.css$": "./css-transform",
  },
  moduleNameMapper: {
    "^@gavinxgu/react-screenshot-test$": "<rootDir>/src/index.ts",
  },
};
