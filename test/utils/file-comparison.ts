import * as path from "node:path";
import * as fse from "fs-extra";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { expect } from "vitest";

/**
 * Verifies that generated files match expected reference files.
 * Automatically discovers all expected files and performs appropriate comparisons based on file type:
 * - .png files → pixel-by-pixel image comparison with visual diff generation
 * - .json files → parsed JSON comparison (handles formatting differences)
 * - other files → exact text comparison
 *
 * Directory structure:
 * - baseDir/output/ - Generated files
 * - baseDir/expected/ - Reference files
 * - baseDir/diff/ - Visual diff images (created automatically for PNG files)
 *
 * @param baseDir - Base directory containing output/, expected/, and diff/ subdirectories
 * @param options - Comparison options
 * @param options.imageThreshold - Pixelmatch threshold for PNG comparison (0-1, default: 0)
 * @param options.generatedAfter - Only compare files modified after this timestamp (filters out pre-existing files)
 * @throws {Error} If file counts don't match or any comparison fails
 */
export async function verifyGeneratedFiles(
	baseDir: string,
	options: { imageThreshold?: number; generatedAfter?: Date } = {},
): Promise<void> {
	const { imageThreshold = 0, generatedAfter } = options;

	const outputDir = path.join(baseDir, "output");
	const expectedDir = path.join(baseDir, "expected");
	const diffDir = path.join(baseDir, "diff");

	const allOutputFiles = await listDirectoryFiles(outputDir);
	const expectedFiles = await listDirectoryFiles(expectedDir);

	// Filter to only files generated after the specified timestamp (if provided)
	let generatedFiles = allOutputFiles;
	if (generatedAfter) {
		generatedFiles = [];
		for (const file of allOutputFiles) {
			const filePath = path.join(outputDir, file);
			const stats = await fse.stat(filePath);
			if (stats.mtime > generatedAfter) {
				generatedFiles.push(file);
			}
		}
	}

	// Verify all expected files were generated
	expect(generatedFiles).toEqual(expectedFiles);

	// Verify each generated file exists and compare with expected
	for (const relativePath of expectedFiles) {
		const outputPath = path.join(outputDir, relativePath);
		const expectedPath = path.join(expectedDir, relativePath);
		const diffPath = path.join(diffDir, relativePath);

		expect(
			await fse.pathExists(outputPath),
			`Expected file was not generated: ${relativePath}`,
		).toBe(true);

		// Determine file type and perform appropriate comparison
		const ext = path.extname(relativePath).toLowerCase();
		switch (ext) {
			case ".png":
				await compareImages(outputPath, expectedPath, diffPath, imageThreshold);
				break;
			case ".json":
				await compareJsonFiles(outputPath, expectedPath);
				break;
			default:
				await compareTextFiles(outputPath, expectedPath);
				break;
		}
	}
}

/**
 * Lists all files in a directory by recursively scanning it.
 * Returns relative paths from the base directory with forward slashes (cross-platform).
 *
 * @param directory - Directory to scan for files
 * @returns Array of relative file paths (e.g., ["mipmap-hdpi/ic_launcher.png"])
 */
async function listDirectoryFiles(directory: string): Promise<string[]> {
	const entries = await fse.readdir(directory, {
		withFileTypes: true,
		recursive: true,
	});

	return entries
		.filter((entry) => entry.isFile())
		.map((entry) =>
			path.join(path.relative(directory, entry.parentPath), entry.name),
		);
}

/**
 * Compares two PNG images pixel-by-pixel and generates a visual diff image.
 *
 * @param outputPath - Path to the generated image file
 * @param expectedPath - Path to the expected reference image file
 * @param diffPath - Path where the visual diff image will be written
 * @param threshold - Pixelmatch threshold for considering pixels as matching (0-1, default: 0)
 * @throws {Error} If images have different dimensions or mismatch ratio exceeds threshold
 */
async function compareImages(
	outputPath: string,
	expectedPath: string,
	diffPath: string,
	threshold: number,
): Promise<void> {
	const outputImage = sharp(outputPath);
	const expectedImage = sharp(expectedPath);

	const outputData = await outputImage
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const expectedData = await expectedImage
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	expect(outputData.info).toEqual(expectedData.info);

	const { width, height } = outputData.info;
	const totalPixelCount = width * height;
	const diffImage = Buffer.alloc(width * height * 4);

	const mismatchingPixelCount = pixelmatch(
		outputData.data,
		expectedData.data,
		diffImage,
		width,
		height,
		{ threshold },
	);

	const mismatchRatio = mismatchingPixelCount / totalPixelCount;

	// Write diff image to help visualize differences
	await fse.ensureDir(path.dirname(diffPath));
	await sharp(diffImage, { raw: { width, height, channels: 4 } })
		.png()
		.toFile(diffPath);

	expect(
		mismatchRatio,
		`Image mismatch: ${(mismatchRatio * 100).toFixed(2)}% of pixels differ (threshold: ${(threshold * 100).toFixed(2)}%). See diff at ${diffPath}`,
	).toBeLessThanOrEqual(threshold);
}

/**
 * Compares two JSON files by parsing and comparing their content.
 * This allows for formatting differences while ensuring semantic equality.
 *
 * @param outputPath - Path to the generated JSON file
 * @param expectedPath - Path to the expected reference JSON file
 * @throws {Error} If JSON content doesn't match
 */
async function compareJsonFiles(
	outputPath: string,
	expectedPath: string,
): Promise<void> {
	const outputContent = await fse.readFile(outputPath, "utf-8");
	const expectedContent = await fse.readFile(expectedPath, "utf-8");
	const filename = path.basename(outputPath);

	const outputJson = JSON.parse(outputContent);
	const expectedJson = JSON.parse(expectedContent);

	expect(outputJson, `JSON content mismatch in ${filename}`).toEqual(
		expectedJson,
	);
}

/**
 * Compares two text files for exact match.
 *
 * @param outputPath - Path to the generated file
 * @param expectedPath - Path to the expected reference file
 * @throws {Error} If file contents don't match
 */
async function compareTextFiles(
	outputPath: string,
	expectedPath: string,
): Promise<void> {
	const outputContent = await fse.readFile(outputPath, "utf-8");
	const expectedContent = await fse.readFile(expectedPath, "utf-8");
	const filename = path.basename(outputPath);
	expect(outputContent, `Text mismatch in ${filename}`).toBe(expectedContent);
}
