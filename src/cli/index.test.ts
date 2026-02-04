import * as path from "node:path";
import * as fse from "fs-extra";
import * as tmp from "tmp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import main from "./index";

describe("cli", () => {
	const originalCwd = process.cwd();
	const fixturesPath = path.join(__dirname, "..", "..", "test_fixtures");

	let tmpDir: tmp.DirResult;
	beforeEach(() => {
		vi.spyOn(global.console, "log").mockImplementation(() => {});
		vi.spyOn(global.console, "debug").mockImplementation(() => {});

		tmpDir = tmp.dirSync({
			unsafeCleanup: true,
		});
		process.chdir(tmpDir.name);
	});
	afterEach(() => {
		process.chdir(originalCwd);
		tmpDir.removeCallback();
		vi.restoreAllMocks();
	});

	it("fails on missing file", async () => {
		await expect(main()).rejects.toThrow("Icon is required");
	});

	it("does not fail for existing file", async () => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));
		await fse.writeJson("app.json", {
			svgAppIcon: {
				backgroundPath: path.join(
					fixturesPath,
					"example",
					"icon-background.svg",
				),
				foregroundPath: path.join(fixturesPath, "example", "icon.svg"),
			},
		});

		await expect(main()).resolves.toBeUndefined();
	});

	it("reads icon path from arguments", async () => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

		await expect(
			main([
				"/usr/local/bin/node",
				"cli.js",
				`--foreground-path=${path.join(fixturesPath, "example", "icon.svg")}`,
			]),
		).resolves.toBeUndefined();
	});
});
