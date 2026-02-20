import path from "node:path";
import * as fse from "fs-extra";

// sharp library is slow to load, only import types here, and import when needed
import type * as SharpType from "sharp";
import type { Logger } from "./logger";
import type { Optional } from "./optional";

const defaultBackgroundPath = path.join(
	__dirname,
	"..",
	"..",
	"assets",
	"default-icon-background.svg",
);

export const inputImageSize = 108;
export const inputContentSize = 72;

export interface Config {
	backgroundPath: string;
	foregroundPath: string;
	logger: Logger | undefined;
}

type FileModificationTime = fse.Stats["mtimeMs"];

export type FileInput = Input<InputData>;
type InputData = {
	backgroundImageData: BackgroundImageData;
	foregroundImageData: ImageData;
};

export interface Input<Data extends Record<string, unknown>> {
	lastModified: FileModificationTime;
	read: () => Promise<Data>;
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

export async function readIcon(config: Optional<Config>): Promise<FileInput> {
	const fullConfig = getConfig(config);

	return {
		lastModified: await getLastModifiedTime(fullConfig),
		read: memoize(() => loadData(fullConfig)),
	};
}

function getConfig(config: Optional<Config>): Config {
	return {
		backgroundPath: config.backgroundPath || defaultBackgroundPath,
		foregroundPath: config.foregroundPath || "./icon.svg",
		logger: config.logger,
	};
}

async function getLastModifiedTime(
	config: Config,
): Promise<FileModificationTime> {
	const fileModifiedTimes = await Promise.all([
		fse.stat(config.backgroundPath).then((stat) => stat.mtimeMs),
		fse.stat(config.foregroundPath).then((stat) => stat.mtimeMs),
	]);

	return Math.max(...fileModifiedTimes);
}

function memoize<T>(fn: () => Promise<T>): () => Promise<T> {
	let cached: Promise<T> | undefined;
	return (): Promise<T> => {
		if (cached === undefined) {
			cached = fn();
		}
		return cached;
	};
}

async function loadData(config: Config): Promise<InputData> {
	if (config.backgroundPath) {
		config.logger?.info("Reading background file", config.backgroundPath);
	}
	if (config.foregroundPath) {
		config.logger?.info("Reading file", config.foregroundPath);
	}

	const [backgroundImageData, foregroundImageData] = await Promise.all([
		readImage(config.backgroundPath),
		readImage(config.foregroundPath),
	]);

	const validBackgroundImage = validateBackgroundImage(backgroundImageData);

	return {
		backgroundImageData: validBackgroundImage,
		foregroundImageData: foregroundImageData,
	};
}

async function readImage(filePath: string): Promise<ImageData> {
	const fileData = await fse.readFile(filePath);

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

export function mapInput<
	OriginalData extends Record<string, unknown>,
	MappedData extends Record<string, unknown>,
>(
	fileInput: Input<OriginalData>,
	mapFunction: (data: OriginalData) => MappedData,
): Input<MappedData> {
	return {
		...fileInput,
		read: memoize(() => fileInput.read().then(mapFunction)),
	};
}
