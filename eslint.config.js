import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Generated, vendored, or non-source trees. `client/src/components/ui` is
    // vendored shadcn/ui and is intentionally left unlinted.
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      ".wrangler/**",
      "client/public/**",
      "client/src/components/ui/**",
      "data/**",
      "patches/**",
    ],
  },

  // ---------------------------------------------------------------------------
  // Client (browser + React)
  // ---------------------------------------------------------------------------
  {
    files: ["client/src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      ...reactRefresh.configs.vite.rules,
      // Downgraded, not disabled: these flag real debt (20 `any` casts, dead
      // locals in modules slated for deletion) that is tracked separately, so
      // CI gates on errors while these stay visible.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // React Compiler advisories. 17 pre-existing `set-state-in-effect` hits
      // are cascading-render smells rather than breakage, and several sit in
      // modules queued for deletion — warn now so CI can gate on errors, and
      // promote to "error" once the backlog is drained.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-refresh/only-export-components": "warn",
    },
  },

  // Web workers get worker globals, not window.
  {
    files: ["client/src/workers/**/*.ts"],
    languageOptions: { globals: globals.worker },
  },

  // ---------------------------------------------------------------------------
  // Cloudflare Worker + shared code
  // ---------------------------------------------------------------------------
  {
    files: ["worker.ts", "shared/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.worker, ...globals.serviceworker },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Silent failure is the single most common defect in this file; every
      // catch must at least surface the error.
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },

  // ---------------------------------------------------------------------------
  // Build scripts (Node, plain JS/ESM — uses import attributes)
  // ---------------------------------------------------------------------------
  {
    files: ["scripts/**/*.{mjs,js}", "*.{mjs,js}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Node-side TypeScript config files.
  {
    files: ["*.config.ts", "vitest.config.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // ---------------------------------------------------------------------------
  // Tests
  // ---------------------------------------------------------------------------
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node, ...globals.browser },
    },
  }
);
