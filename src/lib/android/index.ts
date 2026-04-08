import type { Context } from "../util/context";
import type * as input from "../util/input";
import { generateAdaptiveIcons } from "./adaptive/adaptive-icons";
import type { Config } from "./config";
import { generateLegacyRoundIcons } from "./legacy/round-icons";
import { generateLegacySquareIcons } from "./legacy/square-icons";

export type { Config } from "./config";

export async function* generate(
	context: Context<Config>,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	context.logger?.debug(
		`Android output path: ${context.config.androidOutputPath}`,
	);
	yield* generateLegacySquareIcons(fileInput, context);
	yield* generateLegacyRoundIcons(fileInput, context);
	yield* generateAdaptiveIcons(fileInput, context);
}
