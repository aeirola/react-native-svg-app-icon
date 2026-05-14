import { type } from "arktype";
import { AndroidConfig } from "../android";
import { CacheConfig } from "../cache";
import { IosConfig } from "../ios";
import { InputConfig } from "../util/input";

/**
 * Supported platforms for generating icons.
 */
export const Platform = type("'android'|'ios'");

export const Config = type.merge(
	InputConfig,
	AndroidConfig,
	IosConfig,
	CacheConfig,
	type({
		platforms: Platform.array().default(() => ["android", "ios"]),
	}),
);

export type Platform = typeof Platform.infer;
export type Config = typeof Config.inferIn;
export type ResolvedConfig = typeof Config.infer;
