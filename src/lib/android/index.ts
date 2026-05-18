import type * as input from "../util/input";
import { type AndroidConfig, type ResolvedConfig, getConfig } from "./config";
import type { Context } from "../util/context";
import { generateAdaptiveIcons } from "./adaptive/adaptive-icons";
import { generateLegacyRoundIcons } from "./legacy/round-icons";
import { generateLegacySquareIcons } from "./legacy/square-icons";

export { AndroidConfig } from "./config";

export async function* generate(
  context: Context<AndroidConfig>,
  fileInput: input.FileInput,
): AsyncIterable<string> {
  const resolvedContext: Context<ResolvedConfig> = {
    ...context,
    config: getConfig(context.config),
  };
  resolvedContext.logger?.debug(`Android output path: ${resolvedContext.config.androidOutputPath}`);
  yield* generateLegacySquareIcons(fileInput, resolvedContext);
  yield* generateLegacyRoundIcons(fileInput, resolvedContext);
  yield* generateAdaptiveIcons(fileInput, resolvedContext);
}
