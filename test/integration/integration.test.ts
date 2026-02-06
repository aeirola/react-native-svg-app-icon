import * as path from "node:path";
import * as fse from "fs-extra";
import { beforeAll, describe, expect, it } from "vitest";

import { cleanupTestOutputs } from "../utils/cleanup";
import { runCli } from "../utils/cli-runner";
import { verifyGeneratedFiles } from "../utils/file-comparison";

describe("integration tests", () => {
	const fixturesPath = path.join(__dirname, "assets");

	beforeAll(async () => {
		await cleanupTestOutputs(fixturesPath, [
			"simple",
			"normal",
			"complex",
			"cache-test",
		]);
	});

	it("generates icons in simple project", () => testFixture("simple"));

	it("generates files in normal project", () => testFixture("normal"));

	it(
		"generates files from complex matching fixtures",
		{ timeout: 20 * 1000 }, // Font loading might take some time
		() => testFixture("complex", 0.1),
	);

	it("handles caching correctly", async () => {
		const cacheFixture = path.join(fixturesPath, "cache-test");
		const inputDir = path.join(cacheFixture, "input");
		const outputDir = path.join(cacheFixture, "output");

		// Copy all input files to output directory
		await fse.copy(inputDir, outputDir, { overwrite: true });

		// First run: initial rendering
		const firstRun = await runCli([], { cwd: outputDir });
		expect(firstRun.exitCode).toBe(0);
		const firstRunFiles = firstRun.stdout.match(/Wrote .+/g) || [];
		expect(firstRunFiles.length).toBeGreaterThan(0);

		// Second run: should skip files (cache hit)
		const secondRun = await runCli([], { cwd: outputDir });
		expect(secondRun.exitCode).toBe(0);
		const secondRunFiles = secondRun.stdout.match(/Wrote .+/g) || [];
		expect(secondRunFiles.length).toBe(0);

		// Third run: with --force should re-render all files
		const thirdRun = await runCli(["--force"], { cwd: outputDir });
		expect(thirdRun.exitCode).toBe(0);
		const thirdRunFiles = thirdRun.stdout.match(/Wrote .+/g) || [];
		expect(thirdRunFiles.length).toBe(firstRunFiles.length);
	});

	async function testFixture(
		fixture: string,
		imageThreshold = 0,
	): Promise<void> {
		const fixtureDir = path.join(fixturesPath, fixture);
		const inputDir = path.join(fixtureDir, "input");
		const outputDir = path.join(fixtureDir, "output");

		// Copy all input files to output directory
		await fse.copy(inputDir, outputDir, { overwrite: true });

		// Small delay to ensure clear timestamp separation between copied and generated files
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Record timestamp before generation to filter out pre-existing files
		const generationStartTime = new Date();

		// Run CLI from output directory (no args needed - reads from app.json)
		const result = await runCli([], { cwd: outputDir });

		if (result.exitCode !== 0) {
			throw new Error(
				`CLI failed with exit code ${result.exitCode}:\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
			);
		}

		await verifyGeneratedFiles(fixtureDir, {
			imageThreshold: imageThreshold,
			generatedAfter: generationStartTime,
		});
	}
});
