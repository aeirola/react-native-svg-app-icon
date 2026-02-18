import fs from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { cropSvg, stripSvgXmlHeaders } from "./svg";

describe("util/svg", () => {
	describe("stripSvgXmlHeaders", () => {
		it("removes XML declaration and DOCTYPE from SVG", () => {
			const input = Buffer.from(
				`<?xml version="1.0" encoding="utf-8"?>
				<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
				<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
					<rect fill="#FFFFFF" width="108" height="108"/>
				</svg>`,
				"utf-8",
			);

			const result = stripSvgXmlHeaders(input);

			expect(result).toBe(
				'<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108"><rect fill="#FFFFFF" width="108" height="108"/></svg>',
			);
		});

		it("returns normalized SVG when no declarations are present", () => {
			const input = Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108">
					<circle cx="54" cy="54" r="36"/>
				</svg>`,
				"utf-8",
			);

			const result = stripSvgXmlHeaders(input);

			expect(result).toBe(
				'<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108"><circle cx="54" cy="54" r="36"/></svg>',
			);
		});

		it("removes only XML declaration when DOCTYPE is absent", () => {
			const input = Buffer.from(
				`<?xml version="1.0"?>
				<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108">
				  <rect width="108" height="108"/>
				</svg>`,
				"utf-8",
			);

			const result = stripSvgXmlHeaders(input);

			expect(result).toBe(
				'<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108"><rect width="108" height="108"/></svg>',
			);
		});
	});

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
