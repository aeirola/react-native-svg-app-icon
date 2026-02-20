import * as path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { cleanupTestOutput } from "../../../test/utils/cleanup";
import { verifyGeneratedFiles } from "../../../test/utils/file-comparison";
import * as input from "../../util/input";
import { createLogger } from "../../util/logger";
import type { Config } from "../config";
import { generateVectorDrawable } from "./vector-drawable";

describe("android/vector-drawable", () => {
	const assetsPath = path.join(__dirname, "vector-drawable.test.assets");
	const testAssetsPath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"test",
		"assets",
	);

	beforeAll(async () => {
		// Clean up output directories from previous test runs
		await cleanupTestOutput(assetsPath);
	});

	describe("generateVectorDrawable", () => {
		it("generates vector drawable XML matching expected output", async () => {
			// Load test icon
			const fileInput = await input.readIcon({
				foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
				logger: createLogger("error"),
			});

			const baseDir = assetsPath;
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Map the file input to the expected format
			const imageInput = input.mapInput(
				fileInput,
				(inputData) => inputData.foregroundImageData,
			);

			// Generate vector drawable
			for await (const _file of generateVectorDrawable(
				imageInput,
				"icon",
				config,
			)) {
				// Files are generated and written to disk
			}

			await verifyGeneratedFiles(baseDir);
		});

		it("uses strict mode to fail on unsupported SVG elements", async () => {
			const outputPath = path.join(assetsPath, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Load SVG with text element (unsupported in vector drawable)
			const unsupportedFileInput = await input.readIcon({
				foregroundPath: path.join(testAssetsPath, "text-icon.svg"),
				logger: createLogger("error"),
			});

			const unsupportedInput = input.mapInput(
				unsupportedFileInput,
				(inputData) => inputData.foregroundImageData,
			);

			// Should throw an error due to strict mode
			await expect(async () => {
				for await (const _ of generateVectorDrawable(
					unsupportedInput,
					"unsupported-icon",
					config,
				)) {
					// Consume the generator
				}
			}).rejects.toThrow();
		});
	});
});
