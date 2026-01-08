import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    test: {
      environment: "node",
      include: ["src/__tests__/e2e/**/*.test.ts"],
      testTimeout: 120000,
      hookTimeout: 120000,
      env: {
        ...env,
        TEST_URL: process.env.TEST_URL || env.TEST_URL || "http://localhost:3000",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
