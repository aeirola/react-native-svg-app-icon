import * as path from "node:path";
import * as fse from "fs-extra";
import type * as SharpType from "sharp";

import * as input from "./input";

export interface OutputConfig {
	/** Write output files even if they are newer than input files. */
	force: boolean;
}

interface GenerateInput
	extends input.Input<{
		baseImage: input.ImageData;
		operations?: Array<
			| {
					type: "composite";
					blend?: "overlay" | "mask";
					file: Buffer;
			  }
			| { type: "remove-alpha" }
		>;
	}> {
	cropSize?: number;
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
	if (!(output.force || (await hasChanged(fileInput, output)))) {
		return;
	}

	const sharp = (await import("sharp")).default;
	const { baseImage, operations = [] } = await fileInput.read();
	const metadata = baseImage.metadata;

	await fse.ensureDir(path.dirname(output.filePath));

	const scale =
		fileInput.cropSize === undefined
			? 1
			: input.inputImageSize / fileInput.cropSize;
	const targetDensity =
		(output.outputSize / metadata.width) * metadata.density * scale;
	let image = sharp(baseImage.data, { density: targetDensity });

	for (const operation of operations) {
		switch (operation.type) {
			case "composite": {
				let blend: SharpType.Blend;
				switch (operation.blend) {
					case "overlay":
						blend = "over";
						break;
					case "mask":
						blend = "dest-in";
						break;
					default:
						blend = "over";
				}

				image = sharp(
					await image
						.composite([
							{
								input: await sharp(operation.file, {
									density: targetDensity,
								}).toBuffer(),
								blend: blend,
							},
						])
						.toBuffer(),
				);
				break;
			}
			case "remove-alpha":
				image = image.removeAlpha();
				break;
		}
	}

	const extractRegion = getExtractRegion(
		targetDensity,
		metadata,
		output.outputSize,
	);
	image = image.extract(extractRegion);

	await image
		.png({
			adaptiveFiltering: false,
			compressionLevel: 9,
		})
		.toFile(output.filePath);

	yield output.filePath;
}

function getExtractRegion(
	targetDensity: number,
	metadata: input.ImageData["metadata"],
	outputSize: number,
): SharpType.Region {
	const imageMargin = Math.floor(
		((targetDensity / metadata.density) * metadata.width - outputSize) / 2,
	);

	return {
		top: imageMargin,
		left: imageMargin,
		width: outputSize,
		height: outputSize,
	};
}

async function hasChanged(
	input: input.Input<Record<string, unknown>>,
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
