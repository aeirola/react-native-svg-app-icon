import * as path from "node:path";
import type { BaseConfig } from "../config/base";

export interface ResolvedConfig {
	androidOutputPath: string;
}

export interface PartialConfig extends BaseConfig, ResolvedConfig {}

export function getConfig(config: PartialConfig): ResolvedConfig {
	return {
		androidOutputPath: path.resolve(
			config.projectRoot,
			config.androidOutputPath,
		),
	};
}
