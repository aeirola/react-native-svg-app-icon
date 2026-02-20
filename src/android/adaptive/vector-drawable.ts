import svg2vectordrawable from "svg2vectordrawable";
import type * as input from "../../util/input";
import * as output from "../../util/output";
import type { Config } from "../config";
import { getIconPath } from "../resources";

const adaptiveIconMinSdk = 26;

export async function* generateVectorDrawable(
	imageInput: input.Input<input.ImageData>,
	fileName: string,
	config: Config,
): AsyncIterable<string> {
	const imageData = await imageInput.read();
	const vdData = await svg2vectordrawable(imageData.data.toString("utf-8"), {
		// Fail on unsupported elements, so that we fall back to PNG rendering
		strict: true,
		// Use same default fill behaviour as in SVG spec
		fillBlack: true,
	});
	yield* output.ensureFileContents(
		getIconPath(
			config,
			"drawable",
			{ density: "anydpi", minApiLevel: adaptiveIconMinSdk },
			`${fileName}.xml`,
		),
		vdData,
		config,
	);
}
