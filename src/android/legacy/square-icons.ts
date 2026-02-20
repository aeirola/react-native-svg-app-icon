import * as input from "../../util/input";
import * as output from "../../util/output";
import { prepareForInlining } from "../../util/svg";
import type { Config } from "../config";
import { densities, getIconPath, launcherName } from "../resources";
import { legacyLightningFilter } from "./lightning-filter";
import { legacyIconBaseSize } from "./sizes";

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

/** Full icon size in input SVG coordinates (108px space), matching the legacy icon total area. */
const squareIconSvgSize = input.inputContentSize / legacySquareIconContentRatio;
const squareIconSvgOffset = (input.inputImageSize - squareIconSvgSize) / 2;

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
  viewBox="${[
		squareIconSvgOffset,
		squareIconSvgOffset,
		squareIconSvgSize,
		squareIconSvgSize,
	].join(" ")}"
  width="${squareIconSvgSize}" height="${squareIconSvgSize}">
  <clipPath id="shape">
    <rect
      x="${input.inputImageMargin}" y="${input.inputImageMargin}"
      width="${input.inputContentSize}" height="${input.inputContentSize}"
      rx="${legacySquareIconBorderRadius * squareIconScalingRatio}" ry="${legacySquareIconBorderRadius * squareIconScalingRatio}"
    />
  </clipPath>
  ${legacyLightningFilter}

  <g clip-path="url(#shape)">
    ${prepareForInlining(background, "background")}
    ${prepareForInlining(foreground, "foreground")}
  </g>

  <g filter="url(#legacyLightningFilter)">
    <rect
      x="${input.inputImageMargin}" y="${input.inputImageMargin}"
      width="${input.inputContentSize}" height="${input.inputContentSize}"
      rx="${legacySquareIconBorderRadius * squareIconScalingRatio}" ry="${legacySquareIconBorderRadius * squareIconScalingRatio}"
    />
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
			image: input.mapInput(fileInput, (inputData) => ({
				...inputData.backgroundImageData,
				data: buildSquareLegacyIconSvg(
					inputData.backgroundImageData.data,
					inputData.foregroundImageData.data,
				),
				metadata: {
					...inputData.backgroundImageData.metadata,
					width: squareIconSvgSize,
					height: squareIconSvgSize,
				},
			})),
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
