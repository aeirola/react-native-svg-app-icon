import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Image rendering tests are resource intensive, and can be slow on loaded
		// CI servers
		testTimeout: 60 * 1000,
	},
});
