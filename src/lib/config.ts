import type * as android from "./android";
import type * as ios from "./ios";
import type * as input from "./util/input";
import type { Optional } from "./util/optional";

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

export type Config = android.Config &
	ios.PartialConfig & {
		icon: Optional<input.Config>;
		platforms: Platform[];
		/** Write output files even if they are up-to-date. */
		force?: boolean;
	};
