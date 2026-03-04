import * as path from "node:path";
import * as fse from "fs-extra";
import type { Optional } from "../util/optional";
import type { OutputConfig } from "../util/output";

interface PlatformConfig {
	iosOutputPath: string;
	appName?: string | undefined;
}

export type PartialConfig = Optional<PlatformConfig> & OutputConfig;
export type ResolvedConfig = PlatformConfig & OutputConfig;

export async function getConfig(
	config: PartialConfig,
): Promise<ResolvedConfig> {
	return {
		...config,
		iosOutputPath:
			config.iosOutputPath || (await getIconsetDir(config.appName)),
	};
}

async function getIconsetDir(appName?: string): Promise<string> {
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
			return path.join(preferredPath, "AppIcon.appiconset");
		}
	}

	for (const fileName of await fse.readdir("ios")) {
		const testPath = path.join("ios", fileName, "Images.xcassets");
		if (
			(await fse.pathExists(testPath)) &&
			(await fse.stat(testPath)).isDirectory()
		) {
			return path.join(testPath, "AppIcon.appiconset");
		}
	}

	throw new Error("No Images.xcassets found under ios/ subdirectories");
}
