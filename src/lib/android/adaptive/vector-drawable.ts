import type * as input from "../../util/input";
import * as output from "../../util/output";
import type { Context } from "../../util/context";
import type { ResolvedConfig } from "../config";
import { convert } from "svg-vectordrawable";
import { getIconPath } from "../resources";

const adaptiveIconMinSdk = 26;

export async function* generateVectorDrawable(
  imageInput: input.Input<input.ImageData>,
  fileName: string,
  context: Context<ResolvedConfig>,
): AsyncIterable<string> {
  yield* output.generateFile(
    getIconPath(
      context.config,
      "drawable",
      { density: "anydpi", minApiLevel: adaptiveIconMinSdk },
      `${fileName}.xml`,
    ),
    async () => {
      const imageData = await imageInput.read();
      const { xml } = convert(imageData.data.toString("utf-8"), {
        // Fail on unsupported elements, so that we fall back to PNG rendering
        strict: true,
      });
      return xml;
    },
    context,
  );
}
