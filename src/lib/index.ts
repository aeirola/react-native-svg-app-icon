import * as android from "./android";
import { CacheSession } from "./cache";
import { Config, type Platform, type ResolvedConfig } from "./config";
import * as ios from "./ios";
import type { Context } from "./util/context";
import * as input from "./util/input";
import type { Logger } from "./util/logger";

export { Config } from "./config";
export type { Platform };

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
	const resolvedConfig = Config.assert(config);

	const iconInput = await input.readIcon(resolvedConfig, logger);

	const cache = new CacheSession({
		inputFileBuffers: iconInput.fileBuffers,
		config: resolvedConfig,
		logger,
	});

	const context: Context<ResolvedConfig> = {
		config: resolvedConfig,
		logger,
		cache,
	};

	try {
		if (resolvedConfig.platforms.includes("android")) {
			logger?.info("Generating Android icons");
			yield* android.generate(context, iconInput);
		}
		if (resolvedConfig.platforms.includes("ios")) {
			logger?.info("Generating iOS icons");
			yield* ios.generate(context, iconInput);
		}
	} finally {
		await cache.flush();
	}
}
