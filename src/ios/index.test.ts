import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutputs } from "../../test/utils/cleanup";
import { verifyGeneratedFiles } from "../../test/utils/file-comparison";
import * as input from "../util/input";
import { createLogger } from "../util/logger";
import { type Config, generate } from "./index";

describe("ios/index", () => {
	const assetsPath = path.join(__dirname, "index.test.assets");
	const testAssetsPath = path.join(__dirname, "..", "..", "test", "assets");

	let fileInput: input.FileInput;

	beforeAll(async () => {
		// Clean up output directories from previous test runs
		await cleanupTestOutputs(assetsPath, ["icons"]);
	});

	beforeEach(async () => {
		// Load test icons
		fileInput = await input.readIcon({
			backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
			foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
			logger: createLogger("silent"),
		});
	});

	describe("generate", () => {
		it("generates iOS icons and manifest matching reference files", async () => {
			const baseDir = path.join(assetsPath, "icons");
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				iosOutputPath: outputPath,
				force: false,
			};

			// Generate icons and manifest
			for await (const _file of generate(config, fileInput)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir, {
				imageThreshold: 0.1,
			});
		});
	});
});
