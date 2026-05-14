import * as path from "node:path";
import { type } from "arktype";
import { BaseConfig } from "../config/base";

export const AndroidConfig = type.merge(
	BaseConfig,
	type({
		androidOutputPath: "string = './android/app/src/main/res'",
	}),
);

export type AndroidConfig = typeof AndroidConfig.infer;
export type ResolvedConfig = Pick<AndroidConfig, "androidOutputPath">;

export function getConfig(config: AndroidConfig): ResolvedConfig {
	return {
		androidOutputPath: path.resolve(
			config.projectRoot,
			config.androidOutputPath,
		),
	};
}
