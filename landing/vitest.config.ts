/// <reference types="vitest" />
// Unit tests for the landing's pure logic (the 8 specs ported with it). node
// environment (no DOM). The `@/*` -> `./src/*` alias mirrors tsconfig.json.
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.{test,spec}.ts"],
  },
})
