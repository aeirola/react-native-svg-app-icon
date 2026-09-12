import type * as input from "../../util/input";
import * as output from "../../util/output";
import type { Context } from "../../util/context";
import type { ResolvedConfig } from "../config";
import type { Task } from "../../tasks";
import { getIconPath } from "../resources";
import svg2vectordrawable from "svg2vectordrawable";

const adaptiveIconMinSdk = 26;

export async function* generateVectorDrawable(
  imageInput: input.Input<input.ImageData>,
  fileName: string,
  context: Context<ResolvedConfig>,
  drawable?: string,
): AsyncIterable<Task> {
  const vectorDrawable = drawable ?? (await convertToVectorDrawable(imageInput));

  yield* output.generateFile(
    getIconPath(
      context.config,
      "drawable",
      { density: "anydpi", minApiLevel: adaptiveIconMinSdk },
      `${fileName}.xml`,
    ),
    () => vectorDrawable,
    context,
  );
}

export async function convertToVectorDrawable(
  imageInput: input.Input<input.ImageData>,
): Promise<string> {
  const imageData = await imageInput.read();
  return await svg2vectordrawable(imageData.data.toString("utf-8"), {
    // Fail on unsupported elements, so that we fall back to PNG rendering
    strict: true,
    // Use same default fill behaviour as in SVG spec
    fillBlack: true,
  });
}
