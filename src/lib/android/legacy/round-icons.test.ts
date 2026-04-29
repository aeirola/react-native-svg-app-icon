import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { cleanupTestOutput } from "../../../../test/utils/cleanup";
import { makeContext } from "../../../../test/utils/context";
import { verifyGeneratedFiles } from "../../../../test/utils/file-comparison";
import * as input from "../../util/input";
import type { ResolvedConfig } from "../config";
import { generateLegacyRoundIcons } from "./round-icons";

describe("android/legacy/round-icons", () => {
	const baseDir = path.join(__dirname, "round-icons.test.assets");
	const testAssetsPath = path.join(
		__dirname,
		"..",
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
				projectRoot: __dirname,
				icon: {
					backgroundPath: path.join(
						testAssetsPath,
						"square-icon-background.svg",
					),
					foregroundPath: path.join(
						testAssetsPath,
						"square-icon-foreground.svg",
					),
				},
			},
			undefined,
		);
	});

	it("generates round icons matching reference images", async () => {
		const outputPath = path.join(baseDir, "output");
		const context = makeContext<ResolvedConfig>({
			androidOutputPath: outputPath,
		});

		for await (const _file of generateLegacyRoundIcons(fileInput, context)) {
			// Files are generated and written to disk
		}

		await verifyGeneratedFiles(baseDir, {
			imageThreshold: 0.03,
		});
	});
});
