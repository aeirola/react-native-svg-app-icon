import * as android from "./android";
import { CacheSession } from "./cache";
import type { Config, Platform } from "./config";
import * as ios from "./ios";
import type { Context } from "./util/context";
import * as input from "./util/input";
import type { Logger } from "./util/logger";

export type { Config, Platform };

export async function* generate(
	config: Config,
	logger: Logger,
): AsyncIterable<string> {
	const iconInput = await input.readIcon(config.icon, logger);

	const cache = new CacheSession({
		inputFileBuffers: iconInput.fileBuffers,
		force: config.force ?? false,
	});

	const context: Context<Config> = { config, logger, cache };

	try {
		if (config.platforms.includes("android")) {
			yield* android.generate(context, iconInput);
		}
		if (config.platforms.includes("ios")) {
			yield* ios.generate(context, iconInput);
		}
	} finally {
		await cache.flush();
	}
}
