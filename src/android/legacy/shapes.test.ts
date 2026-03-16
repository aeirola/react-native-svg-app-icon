import * as path from "node:path";
import * as fse from "fs-extra";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { cleanupTestOutput } from "../../../test/utils/cleanup";
import sharpmatch from "../../../test/utils/sharpmatch";
import * as shapes from "./shapes";

describe("android/legacy/shapes", () => {
	const baseDir = path.join(__dirname, "shapes.test.assets");
	const defaultSvgDensity = 72;
	const xhdpiScale = 2;

	beforeAll(async () => {
		await cleanupTestOutput(baseDir);
	});

	it("generates round icons matching reference images", async () => {
		const image = sharp(
			Buffer.from(
				`<svg viewBox="${shapes.legacyIconViewBox}"
					width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
					<defs>
						${shapes.roundIconShape}
						${shapes.roundIconClipPath}
					</defs>

					<rect clip-path="url(#roundIconClipPath)"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}" />
					</svg>`,
			),
			{ density: defaultSvgDensity * xhdpiScale },
		);

		await compareImages(image, "circle", 0.02);
	});

	it("generates square icons matching reference images", async () => {
		const image = sharp(
			Buffer.from(
				`<svg viewBox="${shapes.legacyIconViewBox}"
					width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}">
					<defs>
						${shapes.squareIconShape}
						${shapes.squareIconMask}
					</defs>

					<rect mask="url(#squareIconMask)"
						width="${shapes.legacyIconSize}" height="${shapes.legacyIconSize}" />
					</svg>`,
			),
			{ density: defaultSvgDensity * xhdpiScale },
		);

		await compareImages(image, "square", 0.02);
	});

	async function compareImages(
		generatedImage: sharp.Sharp,
		shapeName: "circle" | "square",
		threshold: number,
	) {
		// For demonstration, write the generated image to disk
		const outputDir = path.join(baseDir, "output");
		await fse.mkdir(outputDir, { recursive: true });
		await generatedImage.toFile(path.join(outputDir, `${shapeName}.png`));

		const expectedImage = sharp(
			path.join(baseDir, "expected", `${shapeName}.png`),
		);

		const diffPath = path.join(baseDir, "diff", `${shapeName}.png`);
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
