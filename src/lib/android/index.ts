import type { Context } from "../util/context";
import type * as input from "../util/input";
import { generateAdaptiveIcons } from "./adaptive/adaptive-icons";
import { type AndroidConfig, getConfig, type ResolvedConfig } from "./config";
import { generateLegacyRoundIcons } from "./legacy/round-icons";
import { generateLegacySquareIcons } from "./legacy/square-icons";

export type { AndroidConfig } from "./config";

export async function* generate(
	context: Context<AndroidConfig>,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	const resolvedContext: Context<ResolvedConfig> = {
		...context,
		config: getConfig(context.config),
	};
	resolvedContext.logger?.debug(
		`Android output path: ${resolvedContext.config.androidOutputPath}`,
	);
	yield* generateLegacySquareIcons(fileInput, resolvedContext);
	yield* generateLegacyRoundIcons(fileInput, resolvedContext);
	yield* generateAdaptiveIcons(fileInput, resolvedContext);
}
