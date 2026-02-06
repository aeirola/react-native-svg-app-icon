import * as fse from "fs-extra";
import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../test/utils/tmp-dir";
import { readArgsConfig, readFileConfig } from "./config";

const it = base.extend({ tmpDir });

describe("cli/config", () => {
	describe("readFileConfig", () => {
		it("returns empty object when app.json does not exist", async ({
			tmpDir: _tmpDir,
		}) => {
			const config = await readFileConfig();

			expect(config).toEqual({});
		});

		it("returns empty object when app.json exists but has no svgAppIcon", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				name: "TestApp",
				displayName: "Test Application",
			});

			const config = await readFileConfig();

			expect(config).toEqual({});
		});

		it("reads svgAppIcon config from app.json", async ({ tmpDir: _tmpDir }) => {
			await fse.writeJson("app.json", {
				name: "TestApp",
				svgAppIcon: {
					backgroundPath: "./custom-background.svg",
					foregroundPath: "./custom-icon.svg",
					platforms: ["android"],
					force: true,
				},
			});

			const config = await readFileConfig();

			expect(config).toEqual({
				backgroundPath: "./custom-background.svg",
				foregroundPath: "./custom-icon.svg",
				platforms: ["android"],
				force: true,
			});
		});

		it("reads partial config from app.json", async ({ tmpDir: _tmpDir }) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					foregroundPath: "./my-icon.svg",
				},
			});

			const config = await readFileConfig();

			expect(config).toEqual({
				foregroundPath: "./my-icon.svg",
			});
		});

		it("returns empty object when app.json has invalid JSON", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeFile("app.json", "invalid json {");

			const config = await readFileConfig();

			expect(config).toEqual({});
		});
	});

	describe("readArgsConfig", () => {
		it("returns empty object when no arguments provided", () => {
			const config = readArgsConfig(["node", "script.js"]);

			expect(config).toEqual({});
		});

		it("reads background-path argument", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--background-path",
				"./custom-bg.svg",
			]);

			expect(config).toEqual({
				backgroundPath: "./custom-bg.svg",
			});
		});

		it("reads foreground-path argument", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--foreground-path",
				"./custom-fg.svg",
			]);

			expect(config).toEqual({
				foregroundPath: "./custom-fg.svg",
			});
		});

		it("reads platforms argument with multiple values", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--platforms",
				"android",
				"ios",
			]);

			expect(config).toEqual({
				platforms: ["android", "ios"],
			});
		});

		it("reads platforms argument with single value", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--platforms",
				"android",
			]);

			expect(config).toEqual({
				platforms: ["android"],
			});
		});

		it("reads force flag", () => {
			const config = readArgsConfig(["node", "script.js", "--force"]);

			expect(config).toEqual({
				force: true,
			});
		});

		it("reads short force flag", () => {
			const config = readArgsConfig(["node", "script.js", "-f"]);

			expect(config).toEqual({
				force: true,
			});
		});

		it("reads android-output-path argument", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--android-output-path",
				"./custom/android/path",
			]);

			expect(config).toEqual({
				androidOutputPath: "./custom/android/path",
			});
		});

		it("reads ios-output-path argument", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--ios-output-path",
				"./custom/ios/path",
			]);

			expect(config).toEqual({
				iosOutputPath: "./custom/ios/path",
			});
		});

		it("reads multiple arguments together", () => {
			const config = readArgsConfig([
				"node",
				"script.js",
				"--background-path",
				"./bg.svg",
				"--foreground-path",
				"./fg.svg",
				"--platforms",
				"android",
				"--force",
				"--android-output-path",
				"./android",
			]);

			expect(config).toEqual({
				backgroundPath: "./bg.svg",
				foregroundPath: "./fg.svg",
				platforms: ["android"],
				force: true,
				androidOutputPath: "./android",
			});
		});
	});
});
