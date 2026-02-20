import * as path from "node:path";
import * as fse from "fs-extra";

import type * as input from "./input";

export interface OutputConfig {
	/** Write output files even if they are newer than input files. */
	force: boolean;
}

interface GenerateInput {
	image: input.Input<input.ImageData>;
	/** Remove alpha channel from the output image. */
	removeAlpha?: boolean;
}

interface GenerateConfig extends OutputConfig {
	filePath: string;
	outputSize: number;
}

export async function* genaratePngs(
	fileInput: GenerateInput,
	outputs: GenerateConfig[],
): AsyncIterable<string> {
	for (const output of outputs) {
		yield* genaratePng(fileInput, output);
	}
}

async function* genaratePng(
	fileInput: GenerateInput,
	output: GenerateConfig,
): AsyncIterable<string> {
	if (!(output.force || (await hasChanged(fileInput.image, output)))) {
		return;
	}

	const sharp = (await import("sharp")).default;
	const inputImage = await fileInput.image.read();
	const metadata = inputImage.metadata;

	await fse.ensureDir(path.dirname(output.filePath));

	const targetDensity = (output.outputSize / metadata.width) * metadata.density;

	let image = sharp(inputImage.data, { density: targetDensity });

	if (fileInput.removeAlpha) {
		image = image.removeAlpha();
	}

	await image
		.png({
			adaptiveFiltering: false,
			compressionLevel: 9,
		})
		.toFile(output.filePath);

	yield output.filePath;
}

async function hasChanged(
	input: input.Input<unknown>,
	output: GenerateConfig,
): Promise<boolean> {
	let outputStat: fse.Stats | null;
	try {
		outputStat = await fse.stat(output.filePath);
	} catch {
		return true;
	}

	if (input.lastModified > outputStat.mtimeMs) {
		return true;
	} else {
		return false;
	}
}

export async function* ensureFileContents(
	path: string,
	content: string | Record<string, unknown>,
	config: OutputConfig,
): AsyncIterable<string> {
	let stringContent: string;
	switch (typeof content) {
		case "object":
			stringContent = JSON.stringify(content, undefined, 2);
			break;
		case "string":
			stringContent = content;
			break;
		default:
			throw Error("Invalid content");
	}
	const contentBuffer = Buffer.from(stringContent, "utf-8");

	if (!config.force && (await hasFileContent(path, contentBuffer))) {
		return;
	} else {
		await fse.outputFile(path, contentBuffer);
		yield path;
	}
}

async function hasFileContent(
	path: string,
	contentBuffer: Buffer,
): Promise<boolean> {
	try {
		const diskFileBuffer = await fse.readFile(path);
		return diskFileBuffer.equals(contentBuffer);
	} catch {
		return false;
	}
}
