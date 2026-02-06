import * as path from "node:path";
import * as fse from "fs-extra";

/**
 * Cleans up test output directories before test runs.
 * Removes both "output" and "diff" directories from the specified test case directories.
 *
 * @param basePath - The base path containing test assets
 * @param testCases - Array of test case directory names (e.g., ["vector-drawable", "png-fallback"])
 *
 * @example
 * ```ts
 * await cleanupTestOutputs(assetsPath, ["vector-drawable", "png-fallback"]);
 * ```
 */
export async function cleanupTestOutputs(
	basePath: string,
	testCases: string[],
): Promise<void> {
	for (const testCase of testCases) {
		await fse.remove(path.join(basePath, testCase, "output"));
		await fse.remove(path.join(basePath, testCase, "diff"));
	}
}

/**
 * Cleans up test output directory directly under the base path.
 * Useful for tests that don't organize output into separate test case directories.
 *
 * @param basePath - The base path containing the output directory
 *
 * @example
 * ```ts
 * await cleanupTestOutput(assetsPath);
 * ```
 */
export async function cleanupTestOutput(basePath: string): Promise<void> {
	await fse.remove(path.join(basePath, "output"));
	await fse.remove(path.join(basePath, "diff"));
}
