import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutputs } from "../../test/utils/cleanup";
import { verifyGeneratedFiles } from "../../test/utils/file-comparison";
import * as input from "../util/input";
import { createLogger } from "../util/logger";
import type { Config } from "./config";
import {
	generateLegacyRoundIcons,
	generateLegacySquareIcons,
} from "./legacy-icons";

describe("android/legacy-icons", () => {
	const assetsPath = path.join(__dirname, "legacy-icons.test.assets");
	const testAssetsPath = path.join(__dirname, "..", "..", "test", "assets");

	let fileInput: input.FileInput;

	beforeAll(async () => {
		// Clean up output directories from previous test runs
		await cleanupTestOutputs(assetsPath, ["square-icons", "round-icons"]);
	});

	beforeEach(async () => {
		// Load test icons
		fileInput = await input.readIcon({
			backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
			foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
			logger: createLogger("silent"),
		});
	});

	describe("generateLegacySquareIcons", () => {
		it("generates square icons matching reference images", async () => {
			const baseDir = path.join(assetsPath, "square-icons");
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Generate icons
			for await (const _file of generateLegacySquareIcons(fileInput, config)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir, {
				imageThreshold: 0.075,
			});
		});
	});

	describe("generateLegacyRoundIcons", () => {
		it("generates round icons matching reference images", async () => {
			const baseDir = path.join(assetsPath, "round-icons");
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Generate icons
			for await (const _file of generateLegacyRoundIcons(fileInput, config)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir, {
				imageThreshold: 0.07,
			});
		});
	});
});
