import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutput } from "../../../test/utils/cleanup";
import { logger, makeContext } from "../../../test/utils/context";
import { verifyGeneratedFiles } from "../../../test/utils/file-comparison";
import * as input from "../../util/input";
import type { Config } from "../config";
import { generateLegacySquareIcons } from "./square-icons";

describe("android/legacy/square-icons", () => {
	const baseDir = path.join(__dirname, "square-icons.test.assets");
	const testAssetsPath = path.join(
		__dirname,
		"..",
		"..",
		"..",
		"test",
		"assets",
	);

	let fileInput: input.FileInput;

	beforeAll(async () => {
		await cleanupTestOutput(baseDir);
	});

	beforeEach(async () => {
		fileInput = await input.readIcon(
			{
				backgroundPath: path.join(testAssetsPath, "square-icon-background.svg"),
				foregroundPath: path.join(testAssetsPath, "square-icon-foreground.svg"),
			},
			logger,
		);
	});

	it("generates square icons matching reference images", async () => {
		const context = makeContext<Config>({
			androidOutputPath: path.join(baseDir, "output"),
		});

		for await (const _file of generateLegacySquareIcons(fileInput, context)) {
			// Files are generated and written to disk
		}

		await verifyGeneratedFiles(baseDir, {
			imageThreshold: 0.045,
		});
	});
});
