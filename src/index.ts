import * as android from "./android";
import { CacheSession } from "./cache";
import * as ios from "./ios";
import * as input from "./util/input";
import type { Logger } from "./util/logger";
import type { Optional } from "./util/optional";

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

type PlatformConfig = android.PartialConfig & ios.PartialConfig;

export type Config = Omit<PlatformConfig, "cache"> & {
	icon: Optional<input.Config>;
	platforms: Platform[];
	logger: Logger;
	/** Write output files even if they are up-to-date. */
	force?: boolean;
};

export async function* generate(config: Config): AsyncIterable<string> {
	const iconInput = await input.readIcon({
		...config.icon,
		logger: config.logger,
	});

	const cache = new CacheSession({
		inputFileBuffers: iconInput.fileBuffers,
		force: config.force ?? false,
	});

	const platformConfig: PlatformConfig = {
		...config,
		cache,
	};

	try {
		if (config.platforms.includes("android")) {
			yield* android.generate(platformConfig, iconInput);
		}
		if (config.platforms.includes("ios")) {
			yield* ios.generate(platformConfig, iconInput);
		}
	} finally {
		await cache.flush();
	}
}
