import * as input from "../util/input";
import * as output from "../util/output";
import type { Config } from "./config";
import {
	densities,
	getIconPath,
	launcherName,
	roundIconName,
} from "./resources";

const legacyIconBaseSize = 48;
const inputIconContentRatio = input.inputContentSize / input.inputImageSize;

// Based on images from image asset studio at
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/resources/images/launcher_stencil/
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java
const legacyLightningFilter = `
  <filter id="legacyLightningFilter">
    <!-- Drop shadow -->
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.4" />
    <feOffset dx="0" dy="1.125" />
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.2"/>
    </feComponentTransfer>
    <feComposite in2="SourceAlpha" operator="out"
      result="shadow"
    />

    <!-- Edge shade -->
    <feComponentTransfer in="SourceAlpha" result="opaque-alpha">
      <feFuncA type="linear" slope="0.2"/>
    </feComponentTransfer>
    <feOffset dx="-0.2" dy="-0.2" in="SourceAlpha" result="offset-alpha" />
    <feComposite in="opaque-alpha" in2="offset-alpha" operator="out"
      result="edge"
    />

    <feMerge>
      <feMergeNode in="shadow" />
      <feMergeNode in="edge" />
    </feMerge>
  </filter>`;

/** Legacy Square Icon **/
const legacySquareIconContentSize = 38;
const legacySquareIconBorderRadius = 3;
const legacySquareIconMargin =
	(legacyIconBaseSize - legacySquareIconContentSize) / 2;
const legacySquareIconContentRatio =
	legacySquareIconContentSize / legacyIconBaseSize;

function getViewBox(input: number): string {
	const size = input / inputIconContentRatio;
	const margin = (size - legacyIconBaseSize) / 2;
	const viewBox = [-margin, -margin, size, size];
	return viewBox.join(" ");
}

const legacySquareIconMask = Buffer.from(
	`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
    />
</svg>`,
	"utf-8",
);

const legacySquareIconOverlay = Buffer.from(
	`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`,
	"utf-8",
);

/** Legacy Round Icon **/
const legacyRoundIconContentSize = 44;
const legacyRoundIconContentRatio =
	legacyRoundIconContentSize / legacyIconBaseSize;

const roundIconMask = Buffer.from(
	`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
    />
</svg>`,
	"utf-8",
);

const roundIconOverlay = Buffer.from(
	`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`,
	"utf-8",
);

export async function* generateLegacySquareIcons(
	fileInput: input.FileInput,
	config: Config,
): AsyncIterable<string> {
	yield* output.genaratePngs(
		{
			...input.mapInput(fileInput, (inputData) => ({
				baseImage: inputData.backgroundImageData,
				operations: [
					{ type: "composite", file: inputData.foregroundImageData.data },
					{ type: "composite", blend: "mask", file: legacySquareIconMask },
					{ type: "composite", file: legacySquareIconOverlay },
				],
			})),
			cropSize: input.inputContentSize / legacySquareIconContentRatio,
		},
		densities.map((density) => ({
			filePath: getIconPath(
				config,
				"mipmap",
				{ density: density.name },
				`${launcherName}.png`,
			),
			outputSize: legacyIconBaseSize * density.scale,
			force: config.force,
		})),
	);
}

export async function* generateLegacyRoundIcons(
	fileInput: input.FileInput,
	config: Config,
): AsyncIterable<string> {
	yield* output.genaratePngs(
		{
			...input.mapInput(fileInput, (inputData) => ({
				baseImage: inputData.backgroundImageData,
				operations: [
					{ type: "composite", file: inputData.foregroundImageData.data },
					{ type: "composite", blend: "mask", file: roundIconMask },
					{ type: "composite", file: roundIconOverlay },
				],
			})),
			cropSize: input.inputContentSize / legacyRoundIconContentRatio,
		},
		densities.map((density) => ({
			filePath: getIconPath(
				config,
				"mipmap",
				{ density: density.name },
				`${roundIconName}.png`,
			),
			outputSize: legacyIconBaseSize * density.scale,
			force: config.force,
		})),
	);
}
