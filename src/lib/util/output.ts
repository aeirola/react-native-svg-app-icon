import * as fse from "fs-extra";

import type { Context } from "./context";
import type * as input from "./input";

interface GenerateInput {
	image: input.Input<input.ImageData>;
	/** Remove alpha channel from the output image. */
	removeAlpha?: boolean;
}

interface GenerateConfig {
	filePath: string;
	outputSize: number;
}

export async function* generatePngs(
	fileInput: GenerateInput,
	outputs: GenerateConfig[],
	context: Context,
): AsyncIterable<string> {
	for (const output of outputs) {
		yield* generatePng(fileInput, output, context);
	}
}

async function* generatePng(
	fileInput: GenerateInput,
	output: GenerateConfig,
	context: Context,
): AsyncIterable<string> {
	yield* generateFile(
		output.filePath,
		async () => {
			const sharp = (await import("sharp")).default;
			const inputImage = await fileInput.image.read();
			const metadata = inputImage.metadata;

			const targetDensity =
				(output.outputSize / metadata.width) * metadata.density;

			let image = sharp(inputImage.data, { density: targetDensity });

			if (fileInput.removeAlpha) {
				image = image.removeAlpha();
			}

			return image
				.png({
					adaptiveFiltering: false,
					compressionLevel: 9,
				})
				.toBuffer();
		},
		context,
	);
}

/**
 * Generates a file at the given path with content provided by `contentProvider`.
 *
 * If the file is already up to date according to the cache session, generation
 * is skipped entirely and `contentProvider` is not called. Otherwise,
 * `contentProvider` is called to produce the file contents, which are written
 * to disk and recorded in the cache.
 *
 * @param path - Destination file path to write.
 * @param contentProvider - Called to produce file contents when the file needs
 *   to be (re-)generated. Strings and objects are UTF-8 encoded (objects are
 *   JSON-serialised); Buffers are written as-is.
 * @param context - Generation context supplying the cache session.
 * @yields The file path when the file was written; yields nothing if skipped.
 */
export async function* generateFile(
	path: string,
	contentProvider:
		| (() => string | Record<string, unknown> | Buffer)
		| (() => Promise<string | Record<string, unknown> | Buffer>),
	{ cache }: Context,
): AsyncIterable<string> {
	if (await cache.isUpToDate(path)) {
		return;
	}

	const content = await contentProvider();
	let contentBuffer: Buffer;
	if (Buffer.isBuffer(content)) {
		contentBuffer = content;
	} else {
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
		contentBuffer = Buffer.from(stringContent, "utf-8");
	}

	await fse.outputFile(path, contentBuffer);
	cache.recordBuffer(path, contentBuffer);
	yield path;
}
