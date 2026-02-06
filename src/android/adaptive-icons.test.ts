import * as path from "node:path";
import { beforeAll, describe, it } from "vitest";

import { cleanupTestOutputs } from "../../test/utils/cleanup";
import { verifyGeneratedFiles } from "../../test/utils/file-comparison";
import * as input from "../util/input";
import { generateAdaptiveIcons } from "./adaptive-icons";
import type { Config } from "./config";

describe("android/adaptive-icons", () => {
	const assetsPath = path.join(__dirname, "adaptive-icons.test.assets");
	const testAssetsPath = path.join(__dirname, "..", "..", "test", "assets");

	beforeAll(async () => {
		// Clean up output directories from previous test runs
		await cleanupTestOutputs(assetsPath, ["vector-drawable", "png-fallback"]);
	});

	describe("generateAdaptiveIcons", () => {
		it("generates vector drawable adaptive icons", async () => {
			const baseDir = path.join(assetsPath, "vector-drawable");
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Load test icons
			const fileInput = await input.readIcon({
				backgroundPath: path.join(testAssetsPath, "react-icon-background.svg"),
				foregroundPath: path.join(testAssetsPath, "react-icon.svg"),
			});

			// Generate adaptive icons
			for await (const _file of generateAdaptiveIcons(fileInput, config)) {
				// Files are generated and written to disk
			}

			// Verify XML files (vector drawables and adaptive icon manifests)
			await verifyGeneratedFiles(baseDir);
		});

		it("falls back to PNG when vector drawable conversion fails", async () => {
			const baseDir = path.join(assetsPath, "png-fallback");
			const outputPath = path.join(baseDir, "output");
			const config: Config = {
				androidOutputPath: outputPath,
				force: false,
			};

			// Load SVG with unsupported elements (text) that will force PNG fallback
			const unsupportedFileInput = await input.readIcon({
				foregroundPath: path.join(testAssetsPath, "text-icon.svg"),
			});

			// Generate adaptive icons
			for await (const _file of generateAdaptiveIcons(
				unsupportedFileInput,
				config,
			)) {
				// Files are generated and written to disk
			}

			// Verify all generated files against expected
			// The expected directory contains both XML (for background vector drawable + manifests)
			// and PNG files (for foreground that failed vector conversion)
			await verifyGeneratedFiles(baseDir, {
				imageThreshold: 0.1,
			});
		});
	});
});
