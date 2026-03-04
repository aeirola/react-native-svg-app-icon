import svg2vectordrawable from "svg2vectordrawable";
import type * as input from "../../util/input";
import * as output from "../../util/output";
import type { ResolvedConfig } from "../config";
import { getIconPath } from "../resources";

const adaptiveIconMinSdk = 26;

export async function* generateVectorDrawable(
	imageInput: input.Input<input.ImageData>,
	fileName: string,
	config: ResolvedConfig,
): AsyncIterable<string> {
	yield* output.generateFile(
		getIconPath(
			config,
			"drawable",
			{ density: "anydpi", minApiLevel: adaptiveIconMinSdk },
			`${fileName}.xml`,
		),
		async () => {
			const imageData = await imageInput.read();
			return await svg2vectordrawable(imageData.data.toString("utf-8"), {
				// Fail on unsupported elements, so that we fall back to PNG rendering
				strict: true,
				// Use same default fill behaviour as in SVG spec
				fillBlack: true,
			});
		},
		config,
	);
}
