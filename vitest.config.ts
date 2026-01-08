import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/__tests__/setup.ts"],
      include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
      exclude: ["src/__tests__/e2e/**"],
      coverage: {
        reporter: ["text", "json", "html"],
        exclude: ["node_modules/", "src/__tests__/"],
      },
      env: {
        ...env,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
