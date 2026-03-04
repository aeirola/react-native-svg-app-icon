import type { Optional } from "../util/optional";
import type { OutputConfig } from "../util/output";

interface PlatformConfig {
	androidOutputPath: string;
}

export type PartialConfig = Optional<PlatformConfig> & OutputConfig;
export type ResolvedConfig = PlatformConfig & OutputConfig;

export function getConfig(config: PartialConfig): ResolvedConfig {
	return {
		...config,
		androidOutputPath: config.androidOutputPath || "./android/app/src/main/res",
	};
}
