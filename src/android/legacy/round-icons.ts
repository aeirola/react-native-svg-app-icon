import * as input from "../../util/input";
import * as output from "../../util/output";
import type { Config } from "../config";
import { densities, getIconPath, roundIconName } from "../resources";
import { prepareForInlining } from "./inline-svg";
import { legacyLightningFilter } from "./lightning-filter";
import { legacyIconBaseSize, viewBox } from "./sizes";

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
    ${legacyLightningFilter}
    <clipPath id="shape">
      <circle
        cx="${input.inputImageSize / 2}" cy="${input.inputImageSize / 2}"
        r="${input.inputContentSize / 2}"
      />
    </clipPath>
  <g clip-path="url(#shape)">
    ${prepareForInlining(background, "background")}
    ${prepareForInlining(foreground, "foreground")}
  </g>

  <g filter="url(#legacyLightningFilter)">
    <circle
      cx="${input.inputImageSize / 2}" cy="${input.inputImageSize / 2}"
      r="${input.inputContentSize / 2}"
    />
  </g>
</svg>`,
		"utf-8",
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
