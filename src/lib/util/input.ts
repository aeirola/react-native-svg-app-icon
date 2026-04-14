import path from "node:path";
import * as fse from "fs-extra";

// sharp library is slow to load, only import types here, and import when needed
import type * as SharpType from "sharp";
import type { Logger } from "./logger";
import { memoize } from "./memoize";
import type { Optional } from "./optional";

const defaultBackgroundPath = path.join(
	__dirname,
	"..",
	"..",
	"..",
	"assets",
	"default-icon-background.svg",
);

/** Size of the full input SVG image. */
export const inputImageSize = 108;
/** Normally visible part of the input SVG image. */
export const inputContentSize = 72;
/** Margin around the input SVG content within the full image. */
export const inputImageMargin = (inputImageSize - inputContentSize) / 2;

export interface Config {
	backgroundPath: string;
	foregroundPath: string;
}

export type FileInput = Input<InputData>;
type InputData = {
	backgroundImageData: BackgroundImageData;
	foregroundImageData: ImageData;
};

export interface Input<Data> {
	/** Eagerly loaded raw file buffers, used for caching and image generation. */
	fileBuffers: InputFileBuffers;
	read: () => Promise<Data>;
}

export interface InputFileBuffers {
	foreground: Buffer;
	background: Buffer;
}

interface ValidMetadata extends SharpType.Metadata {
	format: "svg";
	width: number;
	height: number;
	density: number;
}

interface OpaqueImageStats extends SharpType.Stats {
	isOpaque: true;
}

export interface ImageData {
	data: Buffer;
	metadata: ValidMetadata;
	stats: SharpType.Stats;
}

interface BackgroundImageData extends ImageData {
	stats: OpaqueImageStats;
}

export async function readIcon(
	config: Optional<Config>,
	logger: Logger | undefined,
): Promise<FileInput> {
	const fullConfig = getConfig(config, logger);

	const [backgroundBuffer, foregroundBuffer] = await Promise.all([
		fse.readFile(fullConfig.backgroundPath).catch((error) => {
			throw new Error(
				`Failed to read background icon at ${fullConfig.backgroundPath}`,
				{ cause: error },
			);
		}),
		fse.readFile(fullConfig.foregroundPath).catch((error) => {
			throw new Error(
				`Icon is required, but not found at ${fullConfig.foregroundPath}`,
				{ cause: error },
			);
		}),
	]);

	const fileBuffers: InputFileBuffers = {
		background: backgroundBuffer,
		foreground: foregroundBuffer,
	};

	return {
		fileBuffers,
		read: memoize(() => loadData(fullConfig, fileBuffers, logger)),
	};
}

function getConfig(
	config: Optional<Config>,
	logger: Logger | undefined,
): Config {
	const foregroundPath = config.foregroundPath || "./icon.svg";

	let backgroundPath: string;
	if (config.backgroundPath !== undefined) {
		backgroundPath = config.backgroundPath;
	} else {
		logger?.debug(
			"No background icon specified, falling back to white background",
		);
		backgroundPath = defaultBackgroundPath;
	}

	return { backgroundPath, foregroundPath };
}

async function loadData(
	config: Config,
	buffers: InputFileBuffers,
	logger: Logger | undefined,
): Promise<InputData> {
	if (config.backgroundPath) {
		logger?.debug(`Reading background file ${config.backgroundPath}`);
	}
	if (config.foregroundPath) {
		logger?.debug(`Reading foreground file ${config.foregroundPath}`);
	}

	const [backgroundImageData, foregroundImageData] = await Promise.all([
		readImage(buffers.background),
		readImage(buffers.foreground),
	]);

	const validBackgroundImage = validateBackgroundImage(backgroundImageData);

	return {
		backgroundImageData: validBackgroundImage,
		foregroundImageData: foregroundImageData,
	};
}

async function readImage(fileData: Buffer): Promise<ImageData> {
	const sharp = (await import("sharp")).default;
	const sharpInstance = sharp(fileData);
	const [metadata, stats] = await Promise.all([
		sharpInstance.metadata(),
		sharpInstance.stats(),
	]);

	const validMetadata = validateMetadata(metadata);

	return {
		data: fileData,
		metadata: validMetadata,
		stats: stats,
	};
}

function validateMetadata(metadata: SharpType.Metadata): ValidMetadata {
	if (metadata.format !== "svg") {
		throw new Error(
			`Unsupported image format ${metadata.format || "undefined"}.` +
				`Only SVG images are supported.`,
		);
	}

	if (!metadata.density || !metadata.width || !metadata.height) {
		throw new Error("Unsupported image, missing size and density");
	}

	if (metadata.width !== metadata.height) {
		throw new Error("Input image not square");
	}

	// TODO: Support different sized images
	if (metadata.width !== inputImageSize || metadata.height !== inputImageSize) {
		throw new Error("Input image size not 108x108");
	}

	return {
		...metadata,
		format: metadata.format,
		width: metadata.width,
		height: metadata.height,
		density: metadata.density,
	};
}

function validateBackgroundImage(imageData: ImageData): BackgroundImageData {
	if (imageData.stats.isOpaque) {
		return {
			...imageData,
			stats: {
				...imageData.stats,
				isOpaque: imageData.stats.isOpaque,
			},
		};
	} else {
		throw new Error("Background image needs to be opaque");
	}
}

export function mapInput<OriginalData, MappedData>(
	fileInput: Input<OriginalData>,
	mapFunction: (data: OriginalData) => MappedData,
): Input<MappedData> {
	return {
		...fileInput,
		read: memoize(() => fileInput.read().then(mapFunction)),
	};
}
