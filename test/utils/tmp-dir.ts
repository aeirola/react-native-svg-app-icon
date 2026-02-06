import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Fixture that provides a temporary directory for each test and changes
 * the current working directory to it. Automatically cleans up after each test.
 *
 * @example
 * ```ts
 * import { it as base } from "vitest";
 * import { tmpDir } from "../../test/utils/tmp-dir";
 *
 * const it = base.extend({ tmpDir });
 *
 * it("can write files", async ({ tmpDir }) => {
 *   await fse.writeFile("test.txt", "content");
 *   // tmpDir contains the path to the temporary directory
 * });
 * ```
 */
export const tmpDir = async (
	// biome-ignore lint/correctness/noEmptyPattern: vitest requires a pattern for fixtures
	{},
	use: (tmpDir: string) => Promise<void>,
) => {
	const originalCwd = process.cwd();
	const tmpDirPath = await fs.promises.mkdtemp(
		path.join(os.tmpdir(), "react-native-svg-app-icon-test-"),
	);
	process.chdir(tmpDirPath);

	await use(tmpDirPath);

	process.chdir(originalCwd);
	await fs.promises.rm(tmpDirPath, { recursive: true, force: true });
};
