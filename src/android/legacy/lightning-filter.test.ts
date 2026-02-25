import * as path from "node:path";
import * as fse from "fs-extra";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { cleanupTestOutput } from "../../../test/utils/cleanup";
import sharpmatch from "../../../test/utils/sharpmatch";
import * as lightningFilter from "./lightning-filter";
import * as shapes from "./shapes";

describe("android/legacy/lightning-filter", () => {
	const baseDir = path.join(__dirname, "lightning-filter.test.assets");
	const defaultSvgDensity = 72;
	const xhdpiScale = 2;

	beforeAll(async () => {
		await cleanupTestOutput(baseDir);
	});

	describe("dropShadowFilter", () => {
		it("matches square reference image", async () => {
			const image = sharp(
				Buffer.from(`
					<svg viewBox="${shapes.legacyIconViewBox}"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
						<defs>
						${shapes.squareIconShape}
							${lightningFilter.dropShadowFilter}
						</defs>

						<use href="#squareIconShape" filter="url(#dropShadowFilter)" />
					</svg>`),
				{ density: defaultSvgDensity * xhdpiScale },
			);

			await compareImages(image, "back", "square", 0.0075);
		});

		it("matches circle reference image", async () => {
			const image = sharp(
				Buffer.from(`
					<svg viewBox="${shapes.legacyIconViewBox}"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
						<defs>
						${shapes.roundIconShape}
							${lightningFilter.dropShadowFilter}
						</defs>

						<use href="#roundIconShape" filter="url(#dropShadowFilter)" />
					</svg>`),
				{ density: defaultSvgDensity * xhdpiScale },
			);

			await compareImages(image, "back", "circle", 0.0075);
		});
	});

	describe("shadedEdgeFilter", () => {
		it("matches square reference image", async () => {
			const image = sharp(
				Buffer.from(`
					<svg viewBox="${shapes.legacyIconViewBox}"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
						<defs>
							${shapes.squareIconShape}
							${lightningFilter.shadedEdgeFilter}
						</defs>

						<use href="#squareIconShape" filter="url(#shadedEdgeFilter)" />
					</svg>`),
				{ density: defaultSvgDensity * xhdpiScale },
			);

			await compareImages(image, "fore", "square", 0.015);
		});
		it("matches circle reference image", async () => {
			const image = sharp(
				Buffer.from(`
					<svg viewBox="${shapes.legacyIconViewBox}"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
						<defs>
							${shapes.roundIconShape}
							${lightningFilter.shadedEdgeFilter}
						</defs>

						<use href="#roundIconShape" filter="url(#shadedEdgeFilter)" />
					</svg>`),
				{ density: defaultSvgDensity * xhdpiScale },
			);

			await compareImages(image, "fore", "circle", 0.015);
		});
	});

	async function compareImages(
		generatedImage: sharp.Sharp,
		layer: "back" | "fore",
		shapeName: "circle" | "square",
		threshold: number,
	) {
		// For demonstration, write the generated image to disk
		const outputDir = path.join(baseDir, layer, "output");
		await fse.mkdir(outputDir, { recursive: true });
		await generatedImage.toFile(path.join(outputDir, `${shapeName}.png`));

		const expectedImage = sharp(
			path.join(baseDir, layer, "expected", `${shapeName}.png`),
		);

		const diffPath = path.join(baseDir, layer, "diff", `${shapeName}.png`);
		const { mismatchRatio } = await sharpmatch(generatedImage, expectedImage, {
			threshold,
			alpha: 1,
			diffOutputPath: diffPath,
		});

		expect(
			mismatchRatio,
			`Image mismatch: ${(mismatchRatio * 100).toFixed(2)}% of pixels differ (threshold: ${(threshold * 100).toFixed(2)}%). See diff at ${diffPath}`,
		).toBeLessThanOrEqual(threshold);
	}
});
