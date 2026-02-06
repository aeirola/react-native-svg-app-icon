import * as path from "node:path";
import { describe, expect, it } from "vitest";

import { getIconPath } from "./resources";

describe("android/resources", () => {
	describe("getIconPath", () => {
		const config = { androidOutputPath: path.join("/android", "res") };

		it("generates correct mipmap path with density", () => {
			const result = getIconPath(
				config,
				"mipmap",
				{ density: "mdpi" },
				"icon.png",
			);

			expect(result).toBe(
				path.join("/android", "res", "mipmap-mdpi", "icon.png"),
			);
		});

		it("generates correct drawable path with density", () => {
			const result = getIconPath(
				config,
				"drawable",
				{ density: "xhdpi" },
				"background.xml",
			);

			expect(result).toBe(
				path.join("/android", "res", "drawable-xhdpi", "background.xml"),
			);
		});

		it("includes minApiLevel qualifier when provided", () => {
			const result = getIconPath(
				config,
				"mipmap",
				{ density: "anydpi", minApiLevel: 26 },
				"icon.xml",
			);

			expect(result).toBe(
				path.join("/android", "res", "mipmap-anydpi-v26", "icon.xml"),
			);
		});

		it("works with different file names", () => {
			const result = getIconPath(
				config,
				"mipmap",
				{ density: "xxxhdpi" },
				"ic_launcher_round.png",
			);

			expect(result).toBe(
				path.join("/android", "res", "mipmap-xxxhdpi", "ic_launcher_round.png"),
			);
		});

		it("uses custom output path from config", () => {
			const customConfig = { androidOutputPath: path.join("/custom", "path") };
			const result = getIconPath(
				customConfig,
				"mipmap",
				{ density: "hdpi" },
				"icon.png",
			);

			expect(result).toBe(
				path.join("/custom", "path", "mipmap-hdpi", "icon.png"),
			);
		});
	});
});
