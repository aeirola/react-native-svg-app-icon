import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutput } from "../../../test/utils/cleanup";
import { verifyGeneratedFiles } from "../../../test/utils/file-comparison";
import * as input from "../../util/input";
import { createLogger } from "../../util/logger";
import type { Config } from "../config";
import { generateLegacyRoundIcons } from "./round-icons";

describe("android/legacy/round-icons", () => {
	const baseDir = path.join(__dirname, "round-icons.test.assets");
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
		await cleanupTestOutput(baseDir);
	});

	beforeEach(async () => {
		fileInput = await input.readIcon({
			backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
			foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
			logger: createLogger("silent"),
		});
	});

	describe("generateLegacyRoundIcons", () => {
		it("generates round icons matching reference images", async () => {
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			for await (const _file of generateLegacyRoundIcons(fileInput, config)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir, {
				imageThreshold: 0.07,
			});
		});
	});
});
