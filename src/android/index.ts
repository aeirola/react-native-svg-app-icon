import type * as input from "../util/input";
import { generateAdaptiveIcons } from "./adaptive/adaptive-icons";
import { getConfig, type PartialConfig } from "./config";
import { generateLegacyRoundIcons } from "./legacy/round-icons";
import { generateLegacySquareIcons } from "./legacy/square-icons";

export type { PartialConfig } from "./config";

export async function* generate(
	config: PartialConfig,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	const resolvedConfig = getConfig(config);
	yield* generateLegacySquareIcons(fileInput, resolvedConfig);
	yield* generateLegacyRoundIcons(fileInput, resolvedConfig);
	yield* generateAdaptiveIcons(fileInput, resolvedConfig);
}
