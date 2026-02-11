import fs from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { cropSvg } from "./svg";

describe("util/svg", () => {
	describe("cropSvg", () => {
		const svgFiles = [
			"centered-squares.svg",
			"quadrants.svg",
			"mixed-units.svg",
			"with-declarations.svg",
		];
		const cropSizes = [108, 90, 72, 54, 36, 20];

		it.for(
			svgFiles.flatMap((svgFile) =>
				cropSizes.map((cropSize) => ({ svgFile, cropSize })),
			),
		)("crops $svgFile to $cropSize", ({ svgFile, cropSize }) =>
			compareSvgCrops(svgFile, cropSize));
	});
});

/**
 * Helper function to test SVG cropping by comparing cropped render with extracted region from original
 *
 * @param svgFile - SVG filename in svg.test.assets directory
 * @param cropSize - Size to crop to
 */
async function compareSvgCrops(
	svgFile: string,
	cropSize: number,
): Promise<void> {
	const assetsDir = join(__dirname, "svg.test.assets");
	const originalSvg = await fs.promises.readFile(join(assetsDir, svgFile));

	const originalImage = await sharp(originalSvg);
	const originalImageMetadata = await originalImage.metadata();

	// Render cropped SVG with sharp at target render size
	const croppedImage = await sharp(
		cropSvg(originalSvg, originalImageMetadata.width, cropSize),
	);
	expect((await croppedImage.metadata()).width).toBe(cropSize);

	const croppedRendered = await croppedImage.raw().toBuffer();

	// Render original SVG with sharp at scaled size and extract the cropped region
	const extractOffset = (originalImageMetadata.width - cropSize) / 2;
	const extractedRegion = await originalImage
		.extract({
			left: extractOffset,
			top: extractOffset,
			width: cropSize,
			height: cropSize,
		})
		.raw()
		.toBuffer();

	// Compare images with pixelmatch
	const mismatch = pixelmatch(
		croppedRendered,
		extractedRegion,
		undefined,
		cropSize,
		cropSize,
		{ threshold: 0 },
	);

	expect(mismatch).toBe(0);
}
