import path from "node:path";
import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts: that config loads the Manus dev
// plugins and roots itself at ./client, neither of which suits a Node test run.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
