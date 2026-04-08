import * as android from "./android";
import { CacheSession } from "./cache";
import type { Config, Platform } from "./config";
import * as ios from "./ios";
import type { Context } from "./util/context";
import * as input from "./util/input";
import type { Logger } from "./util/logger";

export type { Config, Platform };

/**
 * Generate platform-specific app icons from SVG source files.
 *
 * @param config - Icon paths, target platforms, and output settings.
 * @param logger - Optional logger for progress and diagnostic messages.
 *   When `undefined`, all logging is disabled.
 */
export async function* generate(
	config: Config,
	logger: Logger | undefined,
): AsyncIterable<string> {
	const iconInput = await input.readIcon(config.icon, logger);

	const cache = new CacheSession({
		inputFileBuffers: iconInput.fileBuffers,
		force: config.force ?? false,
		logger,
	});

	const context: Context<Config> = { config, logger, cache };

	try {
		if (config.platforms.includes("android")) {
			logger?.info("Generating Android icons");
			yield* android.generate(context, iconInput);
		}
		if (config.platforms.includes("ios")) {
			logger?.info("Generating iOS icons");
			yield* ios.generate(context, iconInput);
		}
	} finally {
		await cache.flush();
	}
}
