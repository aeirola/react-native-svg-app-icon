import type { OutputConfig } from "../util/output";

export interface Config extends OutputConfig {
	androidOutputPath: string;
}

export function getConfig(androidOutputPath?: string, force?: boolean): Config {
	return {
		androidOutputPath: androidOutputPath || "./android/app/src/main/res",
		force: force || false,
	};
}
