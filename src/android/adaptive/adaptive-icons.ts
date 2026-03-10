import type { Context } from "../../util/context";
import * as input from "../../util/input";
import * as output from "../../util/output";
import type { Config } from "../config";
import {
	densities,
	getIconPath,
	launcherBackgroundName,
	launcherForegroundName,
	launcherName,
	type ResourceType,
	roundIconName,
} from "../resources";
import { generateVectorDrawable } from "./vector-drawable";

const adaptiveIconMinSdk = 26;
const adaptiveIconBaseSize = 108;

const adaptiveIconContent = (
	launcherBackgroundType: ResourceType,
	launcherForegroundType: ResourceType,
): string => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@${launcherBackgroundType}/${launcherBackgroundName}" />
    <foreground android:drawable="@${launcherForegroundType}/${launcherForegroundName}" />
</adaptive-icon>`;

export async function* generateAdaptiveIcons(
	fileInput: input.FileInput,
	context: Context<Config>,
): AsyncIterable<string> {
	const backgroundImageInput = input.mapInput(
		fileInput,
		(inputData) => inputData.backgroundImageData,
	);
	let backgroundResourceType: ResourceType;
	try {
		yield* generateVectorDrawable(
			backgroundImageInput,
			launcherBackgroundName,
			context,
		);
		backgroundResourceType = "drawable";
	} catch {
		yield* generateAdaptiveIconLayerPng(
			backgroundImageInput,
			launcherBackgroundName,
			context,
		);
		backgroundResourceType = "mipmap";
	}

	const foregroundImageInput = input.mapInput(
		fileInput,
		(inputData) => inputData.foregroundImageData,
	);
	let foregroundResourceType: ResourceType;
	try {
		yield* generateVectorDrawable(
			foregroundImageInput,
			launcherForegroundName,
			context,
		);
		foregroundResourceType = "drawable";
	} catch {
		yield* generateAdaptiveIconLayerPng(
			foregroundImageInput,
			launcherForegroundName,
			context,
		);
		foregroundResourceType = "mipmap";
	}

	// Adaptive icon
	yield* output.generateFile(
		getIconPath(
			context.config,
			"mipmap",
			{ density: "anydpi", minApiLevel: 26 },
			`${launcherName}.xml`,
		),
		() => adaptiveIconContent(backgroundResourceType, foregroundResourceType),
		context,
	);
	yield* output.generateFile(
		getIconPath(
			context.config,
			"mipmap",
			{ density: "anydpi", minApiLevel: 26 },
			`${roundIconName}.xml`,
		),
		() => adaptiveIconContent(backgroundResourceType, foregroundResourceType),
		context,
	);
}

async function* generateAdaptiveIconLayerPng(
	imageInput: input.Input<input.ImageData>,
	fileName: string,
	context: Context<Config>,
): AsyncIterable<string> {
	yield* output.generatePngs(
		{ image: imageInput },
		densities.map((density) => ({
			filePath: getIconPath(
				context.config,
				"mipmap",
				{ density: density.name, minApiLevel: adaptiveIconMinSdk },
				`${fileName}.png`,
			),
			outputSize: adaptiveIconBaseSize * density.scale,
		})),
		context,
	);
}
