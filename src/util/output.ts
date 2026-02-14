import * as path from "node:path";
import * as fse from "fs-extra";
import type * as SharpType from "sharp";

import * as input from "./input";
import { cropSvg } from "./svg";

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

	// Apply SVG cropping if needed - wraps the SVG with an outer viewport that
	// crops to the desired region, avoiding pixel-level rounding issues
	const croppedBaseImage =
		fileInput.cropSize === undefined
			? baseImage.data
			: cropSvg(baseImage.data, input.inputImageSize, fileInput.cropSize);

	// When cropped, the SVG's effective size is cropSize, otherwise full size
	const effectiveSize = fileInput.cropSize ?? metadata.width;
	const targetDensity = (output.outputSize / effectiveSize) * metadata.density;

	let image = sharp(croppedBaseImage, { density: targetDensity });

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

				// Apply same crop to composite overlay/mask files
				const croppedOperationFile =
					fileInput.cropSize === undefined
						? operation.file
						: cropSvg(operation.file, input.inputImageSize, fileInput.cropSize);

				image = sharp(
					await image
						.composite([
							{
								input: await sharp(croppedOperationFile, {
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

	await image
		.png({
			adaptiveFiltering: false,
			compressionLevel: 9,
		})
		.toFile(output.filePath);

	yield output.filePath;
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
