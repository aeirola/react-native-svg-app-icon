import * as path from "node:path";
import { describe, expect, it } from "vitest";

import { CacheSession } from "../cache";
import { getConfig } from "./config";

const makeCache = () =>
	new CacheSession({
		inputFileBuffers: {
			foreground: Buffer.alloc(0),
			background: Buffer.alloc(0),
		},
		force: false,
	});

describe("android/config", () => {
	describe("getConfig", () => {
		it("returns default config when no path provided", () => {
			const config = getConfig({ cache: makeCache() });

			expect(config.androidOutputPath).toBe("./android/app/src/main/res");
		});

		it("uses provided androidOutputPath", () => {
			const customPath = path.join("/custom", "path");
			const config = getConfig({
				androidOutputPath: customPath,
				cache: makeCache(),
			});

			expect(config.androidOutputPath).toBe(customPath);
		});
	});
});
