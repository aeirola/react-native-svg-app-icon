import type * as android from "../android";
import type * as cache from "../cache";
import type * as ios from "../ios";
import type * as input from "../util/input";
import type { BaseConfig } from "./base";

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

export type Config = BaseConfig &
	android.PartialConfig &
	ios.PartialConfig &
	input.PartialConfig &
	cache.PartialConfig & {
		platforms: Platform[];
	};
