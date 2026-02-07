import * as path from "node:path";
import * as fse from "fs-extra";
import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../test/utils/tmp-dir";
import { getConfig } from "./config";

const it = base.extend({ tmpDir });

describe("ios/config", () => {
	describe("getConfig", () => {
		it("uses provided iosOutputPath", async ({ tmpDir: _tmpDir }) => {
			const customPath = path.join("/custom", "path");
			const config = await getConfig({ iosOutputPath: customPath });

			expect(config.iosOutputPath).toBe(customPath);
			expect(config.force).toBe(false);
		});

		it("finds Images.xcassets directory and returns AppIcon.appiconset path", async ({
			tmpDir: _tmpDir,
		}) => {
			// Create Images.xcassets directory structure
			await fse.ensureDir(path.join("ios", "MyProject", "Images.xcassets"));

			const config = await getConfig({});

			expect(config.iosOutputPath).toBe(
				path.join("ios", "MyProject", "Images.xcassets", "AppIcon.appiconset"),
			);
			expect(config.force).toBe(false);
		});

		it("finds Images.xcassets for project with space in name", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.ensureDir(path.join("ios", "My App", "Images.xcassets"));

			const config = await getConfig({});

			expect(config.iosOutputPath).toBe(
				path.join("ios", "My App", "Images.xcassets", "AppIcon.appiconset"),
			);
		});

		it("prefers directory matching app name over other matches", async ({
			tmpDir: _tmpDir,
		}) => {
			// Both directories have Images.xcassets, but app name should win
			await fse.ensureDir(path.join("ios", "My", "Images.xcassets"));
			await fse.ensureDir(path.join("ios", "My App", "Images.xcassets"));

			const config = await getConfig({ appName: "My App" });

			expect(config.iosOutputPath).toBe(
				path.join("ios", "My App", "Images.xcassets", "AppIcon.appiconset"),
			);
		});

		it("falls back to directory scan when app name does not match", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.ensureDir(path.join("ios", "ActualProject", "Images.xcassets"));

			const config = await getConfig({ appName: "DifferentName" });

			expect(config.iosOutputPath).toBe(
				path.join(
					"ios",
					"ActualProject",
					"Images.xcassets",
					"AppIcon.appiconset",
				),
			);
		});

		it("throws error when Images.xcassets directory does not exist", async ({
			tmpDir: _tmpDir,
		}) => {
			// Create ios directory but no Images.xcassets
			await fse.ensureDir(path.join("ios", "MyProject"));

			await expect(getConfig({})).rejects.toThrow(
				"No Images.xcassets found under ios/ subdirectories",
			);
		});
	});
});
