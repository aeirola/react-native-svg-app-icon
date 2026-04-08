import * as path from "node:path";
import * as fse from "fs-extra";
import type { Logger } from "../util/logger";
import type { Optional } from "../util/optional";

interface PlatformConfig {
	iosOutputPath: string;
	appName?: string | undefined;
}

export type PartialConfig = Optional<PlatformConfig>;
export type ResolvedConfig = PlatformConfig;

export async function getConfig(
	config: PartialConfig,
	logger: Logger | undefined,
): Promise<ResolvedConfig> {
	if (config.iosOutputPath) {
		logger?.debug(`Using configured iOS output path: ${config.iosOutputPath}`);
	}
	return {
		...config,
		iosOutputPath:
			config.iosOutputPath || (await getIconsetDir(config.appName, logger)),
	};
}

async function getIconsetDir(
	appName: string | undefined,
	logger: Logger | undefined,
): Promise<string> {
	// Prefer the directory matching the app name from app.json, to avoid
	// picking a wrong subdirectory when multiple matches exist (e.g. "My"
	// vs "My App").
	if (
		appName &&
		!appName.includes(path.sep) &&
		appName !== ".." &&
		appName !== "."
	) {
		const preferredPath = path.join("ios", appName, "Images.xcassets");
		if (
			(await fse.pathExists(preferredPath)) &&
			(await fse.stat(preferredPath)).isDirectory()
		) {
			const result = path.join(preferredPath, "AppIcon.appiconset");
			logger?.debug(
				`Auto-detected iOS output path from app name "${appName}": ${result}`,
			);
			return result;
		}
	}

	for (const fileName of await fse.readdir("ios")) {
		const testPath = path.join("ios", fileName, "Images.xcassets");
		if (
			(await fse.pathExists(testPath)) &&
			(await fse.stat(testPath)).isDirectory()
		) {
			const result = path.join(testPath, "AppIcon.appiconset");
			logger?.debug(
				`Auto-detected iOS output path from directory scan: ${result}`,
			);
			return result;
		}
	}

	throw new Error("No Images.xcassets found under ios/ subdirectories");
}
