import * as fse from "fs-extra";
import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../test/utils/tmp-dir";
import { readConfig } from "./config";

const it = base.extend({ tmpDir });

describe("cli/config", () => {
	describe("readConfig", () => {
		it("returns default config when no app.json or arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig(["node", "script.js"]);

			expect(resolvedConfig).toEqual({
				backgroundPath: "./icon-background.svg",
				foregroundPath: "./icon.svg",
				platforms: ["android", "ios"],
				force: false,
				androidOutputPath: "./android/app/src/main/res",
				logLevel: "info",
			});
		});

		it("merges app name from app.json with defaults", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				name: "TestApp",
				displayName: "Test Application",
			});

			const resolvedConfig = await readConfig(["node", "script.js"]);

			expect(resolvedConfig).toMatchObject({
				appName: "TestApp",
				backgroundPath: "./icon-background.svg",
				foregroundPath: "./icon.svg",
			});
		});

		it("merges svgAppIcon config from app.json with defaults", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				name: "TestApp",
				svgAppIcon: {
					backgroundPath: "./custom-background.svg",
					foregroundPath: "./custom-icon.svg",
					platforms: ["android"],
					force: true,
				},
			});

			const resolvedConfig = await readConfig(["node", "script.js"]);

			expect(resolvedConfig).toEqual({
				appName: "TestApp",
				backgroundPath: "./custom-background.svg",
				foregroundPath: "./custom-icon.svg",
				platforms: ["android"],
				force: true,
				androidOutputPath: "./android/app/src/main/res",
				logLevel: "info",
			});
		});

		it("CLI arguments override app.json config", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					foregroundPath: "./from-file.svg",
					force: false,
				},
			});

			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--foreground-path",
				"./from-cli.svg",
				"--force",
			]);

			expect(resolvedConfig).toMatchObject({
				foregroundPath: "./from-cli.svg",
				force: true,
			});
		});

		it("app.json config overrides defaults", async ({ tmpDir: _tmpDir }) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					logLevel: "debug",
					platforms: ["ios"],
				},
			});

			const resolvedConfig = await readConfig(["node", "script.js"]);

			expect(resolvedConfig).toMatchObject({
				logLevel: "debug",
				platforms: ["ios"],
				backgroundPath: "./icon-background.svg",
			});
		});

		it("throws error for invalid platform in app.json", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					platforms: ["android", "windows"],
				},
			});

			await expect(readConfig(["node", "script.js"])).rejects.toThrow(
				/Invalid app.json/,
			);
		});

		it("throws error for invalid log level in app.json", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					logLevel: "verbose",
				},
			});

			await expect(readConfig(["node", "script.js"])).rejects.toThrow(
				/Invalid app.json/,
			);
		});

		it("throws error for invalid type in app.json", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				svgAppIcon: {
					force: "yes",
					platforms: "android",
				},
			});

			await expect(readConfig(["node", "script.js"])).rejects.toThrow(
				/Invalid app.json/,
			);
		});

		it("handles invalid JSON in app.json gracefully", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeFile("app.json", "invalid json {");

			const resolvedConfig = await readConfig(["node", "script.js"]);

			expect(resolvedConfig).toEqual({
				backgroundPath: "./icon-background.svg",
				foregroundPath: "./icon.svg",
				platforms: ["android", "ios"],
				force: false,
				androidOutputPath: "./android/app/src/main/res",
				logLevel: "info",
			});
		});

		it("reads background-path from CLI arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--background-path",
				"./custom-bg.svg",
			]);

			expect(resolvedConfig).toMatchObject({
				backgroundPath: "./custom-bg.svg",
			});
		});

		it("reads foreground-path from CLI arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--foreground-path",
				"./custom-fg.svg",
			]);

			expect(resolvedConfig).toMatchObject({
				foregroundPath: "./custom-fg.svg",
			});
		});

		it("reads platforms from CLI arguments with multiple values", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--platforms",
				"android",
				"ios",
			]);

			expect(resolvedConfig).toMatchObject({
				platforms: ["android", "ios"],
			});
		});

		it("reads platforms from CLI arguments with single value", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--platforms",
				"android",
			]);

			expect(resolvedConfig).toMatchObject({
				platforms: ["android"],
			});
		});

		it("reads force flag from CLI arguments", async ({ tmpDir: _tmpDir }) => {
			const resolvedConfig = await readConfig(["node", "script.js", "--force"]);

			expect(resolvedConfig).toMatchObject({
				force: true,
			});
		});

		it("reads short force flag from CLI arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig(["node", "script.js", "-f"]);

			expect(resolvedConfig).toMatchObject({
				force: true,
			});
		});

		it("reads android-output-path from CLI arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--android-output-path",
				"./custom/android/path",
			]);

			expect(resolvedConfig).toMatchObject({
				androidOutputPath: "./custom/android/path",
			});
		});

		it("reads ios-output-path from CLI arguments", async ({
			tmpDir: _tmpDir,
		}) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--ios-output-path",
				"./custom/ios/path",
			]);

			expect(resolvedConfig).toMatchObject({
				iosOutputPath: "./custom/ios/path",
			});
		});

		it("reads log-level from CLI arguments", async ({ tmpDir: _tmpDir }) => {
			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--log-level",
				"debug",
			]);

			expect(resolvedConfig).toMatchObject({
				logLevel: "debug",
			});
		});

		it("reads multiple CLI arguments together", async ({ tmpDir: _tmpDir }) => {
			const resolvedConfig = await readConfig([
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

			expect(resolvedConfig).toMatchObject({
				backgroundPath: "./bg.svg",
				foregroundPath: "./fg.svg",
				platforms: ["android"],
				force: true,
				androidOutputPath: "./android",
			});
		});

		it("applies precedence: defaults < app.json < CLI args", async ({
			tmpDir: _tmpDir,
		}) => {
			await fse.writeJson("app.json", {
				name: "AppFromFile",
				svgAppIcon: {
					backgroundPath: "./file-bg.svg",
					foregroundPath: "./file-fg.svg",
					force: true,
					logLevel: "warn",
				},
			});

			const resolvedConfig = await readConfig([
				"node",
				"script.js",
				"--foreground-path",
				"./cli-fg.svg",
				"--log-level",
				"debug",
			]);

			expect(resolvedConfig).toEqual({
				appName: "AppFromFile",
				backgroundPath: "./file-bg.svg",
				foregroundPath: "./cli-fg.svg",
				platforms: ["android", "ios"],
				force: true,
				androidOutputPath: "./android/app/src/main/res",
				logLevel: "debug",
			});
		});
	});
});
