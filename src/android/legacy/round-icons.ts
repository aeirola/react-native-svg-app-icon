import type { Context } from "../../util/context";
import * as input from "../../util/input";
import * as output from "../../util/output";
import { prepareForInlining } from "../../util/svg";
import type { Config } from "../config";
import { densities, getIconPath, roundIconName } from "../resources";
import { dropShadowFilter, shadedEdgeFilter } from "./lightning-filter";
import {
	legacyIconSize,
	legacyIconViewBox,
	legacyRoundIconContentSize,
	roundIconShape,
} from "./shapes";

/**
 * Scaling ratio to fit the input SVG content within the legacy round icon
 * content area.
 */
const inputContentScalingFactor =
	legacyRoundIconContentSize / input.inputContentSize;

/**
 * Translation value to center the scaled input SVG content within the legacy
 * round icon content area.
 */
const scalingCompensationTranslation =
	(legacyIconSize - legacyRoundIconContentSize) / 2 -
	inputContentScalingFactor * input.inputImageMargin;

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
	viewBox="${legacyIconViewBox}"
	width="${legacyIconSize}" height="${legacyIconSize}">
	<defs>
		${roundIconShape}
		<clipPath id="shapeClipPath">
			<use href="#roundIconShape" />
		</clipPath>
		${dropShadowFilter}
		${shadedEdgeFilter}
	</defs>

	<use href="#roundIconShape" filter="url(#dropShadowFilter)" />

	<g clip-path="url(#shapeClipPath)">
		<g transform="translate(${scalingCompensationTranslation} ${scalingCompensationTranslation}) scale(${inputContentScalingFactor})">
			${prepareForInlining(background, "background")}
			${prepareForInlining(foreground, "foreground")}
		</g>
	</g>

	<use href="#roundIconShape" filter="url(#shadedEdgeFilter)" />
</svg>`,
		"utf-8",
	);
}

export async function* generateLegacyRoundIcons(
	fileInput: input.FileInput,
	context: Context<Config>,
): AsyncIterable<string> {
	yield* output.generatePngs(
		{
			image: input.mapInput(fileInput, (inputData) => ({
				...inputData.backgroundImageData,
				data: buildRoundLegacyIconSvg(
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
				`${roundIconName}.png`,
			),
			outputSize: legacyIconSize * density.scale,
		})),
		context,
	);
}
