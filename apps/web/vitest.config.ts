import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["components/__tests__/**", "jsdom"],
    ],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
        "components/**/*.tsx",
      ],
      exclude: [
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/*.d.ts",
        "node_modules/**",
        "lib/local-db.ts",
        "lib/design/**",
        "lib/i18n/**",
        "lib/constants.ts",
        "lib/game-content.ts",
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
