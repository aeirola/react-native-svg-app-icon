import * as path from "node:path";
import type { Context } from "../util/context";
import * as input from "../util/input";
import * as output from "../util/output";
import { prepareForInlining } from "../util/svg";
import { getConfig, type PartialConfig, type ResolvedConfig } from "./config";

const iosIcons = [
	{ idiom: "iphone", scale: 2, size: 20 },
	{ idiom: "iphone", scale: 3, size: 20 },
	{ idiom: "iphone", scale: 2, size: 29 },
	{ idiom: "iphone", scale: 3, size: 29 },
	{ idiom: "iphone", scale: 2, size: 40 },
	{ idiom: "iphone", scale: 3, size: 40 },
	{ idiom: "iphone", scale: 2, size: 60 },
	{ idiom: "iphone", scale: 3, size: 60 },
	{ idiom: "ipad", scale: 1, size: 20 },
	{ idiom: "ipad", scale: 2, size: 20 },
	{ idiom: "ipad", scale: 1, size: 29 },
	{ idiom: "ipad", scale: 2, size: 29 },
	{ idiom: "ipad", scale: 1, size: 40 },
	{ idiom: "ipad", scale: 2, size: 40 },
	{ idiom: "ipad", scale: 1, size: 76 },
	{ idiom: "ipad", scale: 2, size: 76 },
	{ idiom: "ipad", scale: 2, size: 83.5 },
	{ idiom: "ios-marketing", scale: 1, size: 1024 },
];

export type { PartialConfig };

export async function* generate(
	context: Context<PartialConfig>,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	const resolvedContext: Context<ResolvedConfig> = {
		...context,
		config: await getConfig(context.config),
	};

	yield* generateImages(resolvedContext, fileInput);
	yield* generateManifest(resolvedContext);
}

/**
 * Builds a wrapper SVG that composites background and foreground into an iOS
 * icon by inlining both SVGs.
 */
function buildIosIconSvg(background: Buffer, foreground: Buffer): Buffer {
	return Buffer.from(
		`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${[
		input.inputImageMargin,
		input.inputImageMargin,
		input.inputContentSize,
		input.inputContentSize,
	].join(" ")}"
  width="${input.inputContentSize}" height="${input.inputContentSize}">
  ${prepareForInlining(background, "background")}
  ${prepareForInlining(foreground, "foreground")}
</svg>`,
		"utf-8",
	);
}

async function* generateImages(
	context: Context<ResolvedConfig>,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	yield* output.generatePngs(
		{
			image: input.mapInput(fileInput, (inputData) => ({
				...inputData.backgroundImageData,
				data: buildIosIconSvg(
					inputData.backgroundImageData.data,
					inputData.foregroundImageData.data,
				),
				metadata: {
					...inputData.backgroundImageData.metadata,
					width: input.inputContentSize,
					height: input.inputContentSize,
				},
			})),
			removeAlpha: true,
		},
		iosIcons.map((icon) => ({
			filePath: path.join(context.config.iosOutputPath, getIconFilename(icon)),
			outputSize: icon.size * icon.scale,
		})),
		context,
	);
}

async function* generateManifest(
	context: Context<ResolvedConfig>,
): AsyncIterable<string> {
	const fileName = path.join(context.config.iosOutputPath, "Contents.json");
	yield* output.generateFile(
		fileName,
		() => ({
			images: iosIcons.map((icon) => ({
				filename: getIconFilename(icon),
				idiom: icon.idiom,
				scale: `${icon.scale}x`,
				size: `${icon.size}x${icon.size}`,
			})),
			info: {
				author: "react-native-svg-app-icon",
				version: 1,
			},
		}),
		context,
	);
}

function getIconFilename(icon: {
	idiom: string;
	size: number;
	scale: number;
}): string {
	return `${icon.idiom}-${icon.size}@${icon.scale}x.png`;
}
