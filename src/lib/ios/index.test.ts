import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutputs } from "../../../test/utils/cleanup";
import { makeContext } from "../../../test/utils/context";
import { verifyGeneratedFiles } from "../../../test/utils/file-comparison";
import * as input from "../util/input";
import { generate, type PartialConfig } from "./index";

describe("ios/index", () => {
	const assetsPath = path.join(__dirname, "index.test.assets");
	const testAssetsPath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"test",
		"assets",
	);

	let fileInput: input.FileInput;

	beforeAll(async () => {
		// Clean up output directories from previous test runs
		await cleanupTestOutputs(assetsPath, ["icons"]);
	});

	beforeEach(async () => {
		// Load test icons
		fileInput = await input.readIcon(
			{
				backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
				foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
			},
			undefined,
		);
	});

	describe("generate", () => {
		it("generates iOS icons and manifest matching reference files", async () => {
			const baseDir = path.join(assetsPath, "icons");
			const outputPath = path.join(baseDir, "output");
			const context = makeContext<PartialConfig>({
				iosOutputPath: outputPath,
			});

			// Generate icons and manifest
			for await (const _file of generate(context, fileInput)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir);
		});
	});
});
