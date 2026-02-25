import * as path from "node:path";
import * as fse from "fs-extra";
import pixelmatch from "pixelmatch";
import sharp from "sharp";

type PixelmatchOptions = Parameters<typeof pixelmatch>[5];
type SharpmatchOptions = PixelmatchOptions & {
	/** Optional path to save the diff image */
	diffOutputPath?: string;
};

type SharpmatchResult = {
	mismatchingPixelCount: number;
	mismatchRatio: number;
	diffImage: sharp.Sharp;
};

/**
 * Compare two equally sized sharp images, pixel by pixel.
 *
 * @param img1 The first image to compare, either a sharp instance or a file path.
 * @param img2 The second image to compare, either a sharp instance or a file path.
 * @param options Optional comparison options, including pixelmatch options and diff output path.
 * @returns An object containing the mismatching pixel count, mismatch ratio, and the diff image.
 */
export default async function sharpmatch(
	img1: sharp.Sharp | string,
	img2: sharp.Sharp | string,
	options: SharpmatchOptions = {},
): Promise<SharpmatchResult> {
	const sharpImage1 = typeof img1 === "string" ? sharp(img1) : img1;
	const sharpImage2 = typeof img2 === "string" ? sharp(img2) : img2;

	const imageMetadata1 = await sharpImage1.metadata();

	const diffBuffer = Buffer.alloc(
		imageMetadata1.width * imageMetadata1.height * 4,
	);

	const mismatchingPixelCount = pixelmatch(
		await sharpImage1.ensureAlpha().raw().toBuffer(),
		await sharpImage2.ensureAlpha().raw().toBuffer(),
		diffBuffer,
		imageMetadata1.width,
		imageMetadata1.height,
		options,
	);

	const totalPixelCount = imageMetadata1.width * imageMetadata1.height;
	const mismatchRatio = mismatchingPixelCount / totalPixelCount;
	const diffImage = sharp(diffBuffer, {
		raw: {
			width: imageMetadata1.width,
			height: imageMetadata1.height,
			channels: 4,
		},
	});

	if (options.diffOutputPath) {
		await fse.mkdir(path.dirname(options.diffOutputPath), { recursive: true });
		await diffImage.png().toFile(options.diffOutputPath);
	}

	return {
		mismatchingPixelCount,
		mismatchRatio,
		diffImage,
	};
}
