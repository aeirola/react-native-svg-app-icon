import * as android from "./android";
import * as ios from "./ios";
import * as input from "./util/input";
import type { Logger } from "./util/logger";
import type { Optional } from "./util/optional";

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

export interface Config extends Optional<android.Config>, Optional<ios.Config> {
	icon: Optional<input.Config>;
	platforms: Platform[];
	logger: Logger;
}

export async function* generate(config: Config): AsyncIterable<string> {
	const iconInput = await input.readIcon({
		...config.icon,
		logger: config.logger,
	});

	if (config.platforms.includes("android")) {
		yield* android.generate(config, iconInput);
	}
	if (config.platforms.includes("ios")) {
		yield* ios.generate(config, iconInput);
	}
}
