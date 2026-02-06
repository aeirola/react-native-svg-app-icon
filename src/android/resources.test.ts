import { describe, expect, it } from "vitest";

import { getIconPath } from "./resources";

describe("android/resources", () => {
	describe("getIconPath", () => {
		const config = { androidOutputPath: "/android/res" };

		it("generates correct mipmap path with density", () => {
			const path = getIconPath(
				config,
				"mipmap",
				{ density: "mdpi" },
				"icon.png",
			);

			expect(path).toBe("/android/res/mipmap-mdpi/icon.png");
		});

		it("generates correct drawable path with density", () => {
			const path = getIconPath(
				config,
				"drawable",
				{ density: "xhdpi" },
				"background.xml",
			);

			expect(path).toBe("/android/res/drawable-xhdpi/background.xml");
		});

		it("includes minApiLevel qualifier when provided", () => {
			const path = getIconPath(
				config,
				"mipmap",
				{ density: "anydpi", minApiLevel: 26 },
				"icon.xml",
			);

			expect(path).toBe("/android/res/mipmap-anydpi-v26/icon.xml");
		});

		it("works with different file names", () => {
			const path = getIconPath(
				config,
				"mipmap",
				{ density: "xxxhdpi" },
				"ic_launcher_round.png",
			);

			expect(path).toBe("/android/res/mipmap-xxxhdpi/ic_launcher_round.png");
		});

		it("uses custom output path from config", () => {
			const customConfig = { androidOutputPath: "/custom/path" };
			const path = getIconPath(
				customConfig,
				"mipmap",
				{ density: "hdpi" },
				"icon.png",
			);

			expect(path).toBe("/custom/path/mipmap-hdpi/icon.png");
		});
	});
});
