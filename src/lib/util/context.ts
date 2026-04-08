import type { CacheSession } from "../cache";
import type { Logger } from "./logger";

/**
 * Runtime context for icon generation, containing operational dependencies
 * that are separate from pure configuration values.
 *
 * The generic type parameter `Config` allows each layer to declare only the
 * configuration fields it actually needs, mirroring how the config interfaces
 * are scoped per platform/module.
 */
export interface Context<Config = unknown> {
	config: Config;
	logger: Logger | undefined;
	cache: CacheSession;
}
