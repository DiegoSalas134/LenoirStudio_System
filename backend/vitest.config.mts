import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: { NODE_ENVIRONMENT: "test" },
    fileParallelism: false,
    coverage: {
      clean: false,
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
      reportOnFailure: true,
    },
  },
});