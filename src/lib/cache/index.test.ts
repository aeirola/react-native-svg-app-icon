import * as fse from "fs-extra";
import { it as base, describe, expect } from "vitest";

import { tmpDir } from "../../../test/utils/tmp-dir";
import { CacheSession } from "./index";
import * as storage from "./storage";

const it = base.extend({ tmpDir });

// Helper: write a file with given content, return its path
async function writeFile(filePath: string, content: string): Promise<string> {
	await fse.outputFile(filePath, content, "utf-8");
	return filePath;
}

describe("cache", () => {
	describe("CacheSession", () => {
		describe("isUpToDate", () => {
			it("returns false when no cache exists (cold start)", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "fake-png-data");

				const session = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});

				expect(await session.isUpToDate(outputFile)).toBe(false);
			});

			it("returns false when force is true even if cache is warm", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "fake-png-data");

				// Build warm cache
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Force-mode session should still return false
				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: true,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(false);
			});

			it("returns true when inputs and output are unchanged (warm cache)", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "fake-png-data");

				// Build warm cache
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Second session should find it up-to-date
				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(true);
			});

			it("returns false for all outputs when an input file changes", async ({
				tmpDir: _tmpDir,
			}) => {
				const originalBuffer = Buffer.from("<svg>original</svg>", "utf-8");
				const output1 = await writeFile("out1.png", "png-data-1");
				const output2 = await writeFile("out2.png", "png-data-2");

				// Build cache with original input
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: originalBuffer,
						background: originalBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(output1, await fse.readFile(output1));
				session1.recordBuffer(output2, await fse.readFile(output2));
				await session1.flush();

				// Simulate input content change via a different buffer
				const changedBuffer = Buffer.from("<svg>changed</svg>", "utf-8");

				// New session should see all outputs as stale
				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: changedBuffer,
						background: changedBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(output1)).toBe(false);
				expect(await session2.isUpToDate(output2)).toBe(false);
			});

			it("returns false for all outputs when package version has changed", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "fake-png-data");

				// Build a warm cache but with an old package version written manually
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Tamper with the cached version to simulate an upgrade
				const cacheData = await storage.readCacheData(undefined);
				await storage.writeCacheData({
					...cacheData,
					packageVersion: "0.0.0",
				});

				// New session should see all outputs as stale
				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(false);
			});

			it("returns false only for a deleted output, true for unchanged ones", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const output1 = await writeFile("out1.png", "png-data-1");
				const output2 = await writeFile("out2.png", "png-data-2");

				// Build warm cache
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(output1, await fse.readFile(output1));
				session1.recordBuffer(output2, await fse.readFile(output2));
				await session1.flush();

				// Delete one output
				await fse.remove(output1);

				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(output1)).toBe(false);
				expect(await session2.isUpToDate(output2)).toBe(true);
			});

			it("returns false for an output that was modified externally", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "original-data");

				// Build warm cache
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Externally modify the output file
				await writeFile("output.png", "tampered-data");

				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(false);
			});

			it("handles multiple input files — change to any input invalidates all outputs", async ({
				tmpDir: _tmpDir,
			}) => {
				const bgBuffer = Buffer.from("<svg>background</svg>", "utf-8");
				const fgBuffer = Buffer.from("<svg>foreground</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "png-data");

				// Build warm cache with both inputs
				const session1 = new CacheSession({
					inputFileBuffers: { foreground: fgBuffer, background: bgBuffer },
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Warm — no changes
				const session2 = new CacheSession({
					inputFileBuffers: { foreground: fgBuffer, background: bgBuffer },
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(true);

				// Simulate change to background only
				const bgBufferChanged = Buffer.from(
					"<svg>background-changed</svg>",
					"utf-8",
				);

				const session3 = new CacheSession({
					inputFileBuffers: {
						foreground: fgBuffer,
						background: bgBufferChanged,
					},
					force: false,
					logger: undefined,
				});
				expect(await session3.isUpToDate(outputFile)).toBe(false);
			});

			it("remains up-to-date on the third run when the second run skipped the file", async ({
				tmpDir: _tmpDir,
			}) => {
				const inputBuffer = Buffer.from("<svg>input</svg>", "utf-8");
				const outputFile = await writeFile("output.png", "fake-png-data");

				// Run 1: generate and record the output
				const session1 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				session1.recordBuffer(outputFile, await fse.readFile(outputFile));
				await session1.flush();

				// Run 2: file is up-to-date — no recordBuffer call, just flush
				const session2 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session2.isUpToDate(outputFile)).toBe(true);
				// Intentionally omit session2.recordBuffer() to simulate a skipped file
				await session2.flush();

				// Run 3: file should still be considered up-to-date
				const session3 = new CacheSession({
					inputFileBuffers: {
						foreground: inputBuffer,
						background: inputBuffer,
					},
					force: false,
					logger: undefined,
				});
				expect(await session3.isUpToDate(outputFile)).toBe(true);
			});
		});
	});
});
