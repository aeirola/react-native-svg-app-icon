import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Image rendering tests that include text are resource intensive as they
		// need to load system fonts. Especially in Windows CI enviroments this can
		// lead to timeouts.
		testTimeout: 60 * 1000,
	},
});
