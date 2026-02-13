import type { Config } from "jest";
import nextJest from "next/jest.js";

const config: Config = {
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
};

const createJestConfig = nextJest({
  dir: "./",
});

export default createJestConfig(config);
