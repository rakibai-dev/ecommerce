import { defineConfig } from "vitest/config";

/**
 * Unit tests for framework-agnostic logic (no React rendering): pure helpers,
 * the cart store, and server actions with mocked I/O. React component testing
 * (Testing Library) can be added later with @vitejs/plugin-react if needed.
 */
export default defineConfig({
  // Vite 8 resolves "@/*" aliases straight from tsconfig.json (the old
  // vite-tsconfig-paths plugin is no longer needed).
  resolve: { tsconfigPaths: true },
  test: {
    // Node by default; browser-API tests opt in per file with the
    // `@vitest-environment happy-dom` docblock.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
