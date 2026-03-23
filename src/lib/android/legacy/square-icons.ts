import type { Context } from "../../util/context";
import * as input from "../../util/input";
import * as output from "../../util/output";
import { prepareForInlining } from "../../util/svg";
import type { Config } from "../config";
import { densities, getIconPath, launcherName } from "../resources";
import { dropShadowFilter, shadedEdgeFilter } from "./lightning-filter";
import {
	legacyIconSize,
	legacyIconViewBox,
	legacySquareIconContentSize,
	squareIconMask,
	squareIconShape,
} from "./shapes";

/**
 * Scaling ratio to fit the input SVG content within the legacy square icon
 * content area.
 */
const inputContentScalingFactor =
	legacySquareIconContentSize / input.inputContentSize;
/**
 * Translation value to center the scaled input SVG content within the legacy
 * square icon content area.
 */
const scalingCompensationTranslation =
	(legacyIconSize - legacySquareIconContentSize) / 2 -
	inputContentScalingFactor * input.inputImageMargin;

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
	viewBox="${legacyIconViewBox}"
	width="${legacyIconSize}" height="${legacyIconSize}">
	<defs>
		${squareIconShape}
		${squareIconMask}
		${dropShadowFilter}
		${shadedEdgeFilter}
	</defs>

	<use href="#squareIconShape" filter="url(#dropShadowFilter)" />

	<g mask="url(#squareIconMask)">
		<g transform="translate(${scalingCompensationTranslation} ${scalingCompensationTranslation}) scale(${inputContentScalingFactor})">
			${prepareForInlining(background, "background")}
			${prepareForInlining(foreground, "foreground")}
		</g>
	</g>

	<use href="#squareIconShape" filter="url(#shadedEdgeFilter)" />
</svg>`,
		"utf-8",
	);
}

export async function* generateLegacySquareIcons(
	fileInput: input.FileInput,
	context: Context<Config>,
): AsyncIterable<string> {
	yield* output.generatePngs(
		{
			image: input.mapInput(fileInput, (inputData) => ({
				...inputData.backgroundImageData,
				data: buildSquareLegacyIconSvg(
					inputData.backgroundImageData.data,
					inputData.foregroundImageData.data,
				),
				metadata: {
					...inputData.backgroundImageData.metadata,
					width: legacyIconSize,
					height: legacyIconSize,
				},
			})),
		},
		densities.map((density) => ({
			filePath: getIconPath(
				context.config,
				"mipmap",
				{ density: density.name },
				`${launcherName}.png`,
			),
			outputSize: legacyIconSize * density.scale,
		})),
		context,
	);
}
