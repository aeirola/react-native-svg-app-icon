import type * as input from "../util/input";
import type { Optional } from "../util/optional";
import { generateAdaptiveIcons } from "./adaptive/adaptive-icons";
import { type Config, getConfig } from "./config";
import { generateLegacyRoundIcons } from "./legacy/round-icons";
import { generateLegacySquareIcons } from "./legacy/square-icons";

export type { Config } from "./config";

export async function* generate(
	config: Optional<Config>,
	fileInput: input.FileInput,
): AsyncIterable<string> {
	const fullConfig = getConfig(config.androidOutputPath, config.force);
	yield* generateLegacySquareIcons(fileInput, fullConfig);
	yield* generateLegacyRoundIcons(fileInput, fullConfig);
	yield* generateAdaptiveIcons(fileInput, fullConfig);
}
