import * as path from "node:path";
import * as fse from "fs-extra";
import { it as baseIt, describe, expect } from "vitest";

import { tmpDir } from "../../test/utils/tmp-dir";
import main from "./index";

const it = baseIt.extend({ tmpDir });

describe("cli", () => {
	const testAssetsPath = path.join(__dirname, "..", "..", "test", "assets");

	it("fails on missing file", async ({ tmpDir: _tmpDir }) => {
		await expect(
			main(["/usr/local/bin/node", "cli.js", "--log-level=error"]),
		).rejects.toThrow("Icon is required");
	});

	it("does not fail for existing file", async ({ tmpDir: _tmpDir }) => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));
		await fse.writeJson("app.json", {
			svgAppIcon: {
				backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
				foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
				logLevel: "error",
			},
		});

		await expect(main()).resolves.toBeUndefined();
	});

	it("reads icon path from arguments", async ({ tmpDir: _tmpDir }) => {
		await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

		await expect(
			main([
				"/usr/local/bin/node",
				"cli.js",
				`--foreground-path=${path.join(testAssetsPath, "react-icon.svg")}`,
				"--log-level=error",
			]),
		).resolves.toBeUndefined();
	});
});
