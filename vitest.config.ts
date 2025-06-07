import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Include only TypeScript test files
		include: ["**/*.test.ts", "**/*.spec.ts"],
		// Exclude build directory and any JS files
		exclude: ["build/**", "node_modules/**", "**/*.js", "**/*.mjs"],
		testTimeout: 30000,
	},
});
