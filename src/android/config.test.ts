import * as path from "node:path";
import { describe, expect, it } from "vitest";

import { getConfig } from "./config";

describe("android/config", () => {
	describe("getConfig", () => {
		it("returns default config when no parameters provided", () => {
			const config = getConfig();

			expect(config).toEqual({
				androidOutputPath: "./android/app/src/main/res",
				force: false,
			});
		});

		it("uses provided androidOutputPath", () => {
			const customPath = path.join("/custom", "path");
			const config = getConfig(customPath);

			expect(config.androidOutputPath).toBe(customPath);
			expect(config.force).toBe(false);
		});

		it("uses provided force flag", () => {
			const config = getConfig(undefined, true);

			expect(config.androidOutputPath).toBe("./android/app/src/main/res");
			expect(config.force).toBe(true);
		});

		it("uses both provided parameters", () => {
			const customPath = path.join("/custom", "path");
			const config = getConfig(customPath, true);

			expect(config).toEqual({
				androidOutputPath: customPath,
				force: true,
			});
		});
	});
});
