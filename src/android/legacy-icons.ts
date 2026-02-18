import * as input from "../util/input";
import * as output from "../util/output";
import { stripSvgXmlHeaders } from "../util/svg";
import type { Config } from "./config";
import {
	densities,
	getIconPath,
	launcherName,
	roundIconName,
} from "./resources";

/**
 * ViewBox for final SVG image. This is the same as the input foreground and
 * background images.
 *
 * Images, masks and lightning effects are composed in the 108x108 scale so
 * that the source images can be used as is. Legacy icon sizing needs to be
 * scaled to this sizing.
 */
const viewBox = [0, 0, input.inputImageSize, input.inputImageSize].join(" ");

/**
 * Size of the legacy icon content area in legacy icon sizing units (dp).
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#55
 */
const legacyIconBaseSize = 48;

// Based on images from image asset studio at
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/resources/images/launcher_stencil/
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java
const legacyLightningFilter = `
	<filter id="legacyLightningFilter">
    <!-- Drop shadow -->
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
    <feOffset dx="0" dy="2.25" />
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
    <feOffset dx="-0.4" dy="-0.4" in="SourceAlpha" result="offset-alpha" />
    <feComposite in="opaque-alpha" in2="offset-alpha" operator="out"
      result="edge"
    />

    <feMerge>
			<feMergeNode in="SourceGraphic" />
			<feMergeNode in="shadow" />
			<feMergeNode in="edge" />
    </feMerge>
  </filter>`;

// Legacy Square Icon

/**
 * Size of the square icon content within `legacyIconBaseSize`.
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#294
 */
const legacySquareIconContentSize = 38;
const legacySquareIconBorderRadius = 3;
const legacySquareIconContentRatio =
	legacySquareIconContentSize / legacyIconBaseSize;

const squareIconScalingRatio =
	input.inputContentSize / legacySquareIconContentSize;
const squareIconMargin = (input.inputImageSize - input.inputContentSize) / 2;

/**
 * Builds a wrapper SVG that composites background and foreground into a legacy
 * square icon.
 */
function buildSquareLegacyIconSvg(
	background: Buffer,
	foreground: Buffer,
): Buffer {
	return Buffer.from(
		`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
	viewBox="${viewBox}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
  <defs>
    <clipPath id="shape">
			<rect
				x="${squareIconMargin}" y="${squareIconMargin}"
				width="${input.inputContentSize}" height="${input.inputContentSize}"
				rx="${legacySquareIconBorderRadius * squareIconScalingRatio}" ry="${legacySquareIconBorderRadius * squareIconScalingRatio}"
			/>
    </clipPath>
    ${legacyLightningFilter}
  </defs>

	<g filter="url(#legacyLightningFilter)">
		<g clip-path="url(#shape)">
			${stripSvgXmlHeaders(background)}
			${stripSvgXmlHeaders(foreground)}
		</g>
	</g>
</svg>`,
		"utf-8",
	);
}

// Legacy Round Icon

/**
 * Size of the round icon content within `legacyIconBaseSize`.
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#289
 */
const legacyRoundIconContentSize = 44;
const legacyRoundIconContentRatio =
	legacyRoundIconContentSize / legacyIconBaseSize;

/**
 * Builds a wrapper SVG that composites background and foreground into a legacy
 * round icon.
 */
function buildRoundLegacyIconSvg(
	background: Buffer,
	foreground: Buffer,
): Buffer {
	return Buffer.from(
		`<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${viewBox}"
	width="${input.inputImageSize}" height="${input.inputImageSize}">
  <defs>
		${legacyLightningFilter}
    <clipPath id="shape">
			<circle
				cx="${input.inputImageSize / 2}" cy="${input.inputImageSize / 2}"
				r="${input.inputContentSize / 2}"
			/>
    </clipPath>
  </defs>

	<g filter="url(#legacyLightningFilter)">
		<g clip-path="url(#shape)">
			${stripSvgXmlHeaders(background)}
			${stripSvgXmlHeaders(foreground)}
	  </g>
  </g>
</svg>`,
		"utf-8",
	);
}

export async function* generateLegacySquareIcons(
	fileInput: input.FileInput,
	config: Config,
): AsyncIterable<string> {
	yield* output.genaratePngs(
		{
			...input.mapInput(fileInput, (inputData) => ({
				baseImage: {
					...inputData.backgroundImageData,
					data: buildSquareLegacyIconSvg(
						inputData.backgroundImageData.data,
						inputData.foregroundImageData.data,
					),
				},
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
				baseImage: {
					...inputData.backgroundImageData,
					data: buildRoundLegacyIconSvg(
						inputData.backgroundImageData.data,
						inputData.foregroundImageData.data,
					),
				},
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
