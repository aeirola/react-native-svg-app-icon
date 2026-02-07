import * as path from "node:path";
import * as fse from "fs-extra";
import type { Optional } from "../util/optional";
import type { OutputConfig } from "../util/output";

export interface Config extends OutputConfig {
	iosOutputPath: string;
	appName?: string;
}

export async function getConfig(config: Optional<Config>): Promise<Config> {
	return {
		iosOutputPath:
			config.iosOutputPath || (await getIconsetDir(config.appName)),
		force: config.force || false,
	};
}

async function getIconsetDir(appName?: string): Promise<string> {
	// Prefer the directory matching the app name from app.json, to avoid
	// picking a wrong subdirectory when multiple matches exist (e.g. "My"
	// vs "My App").
	if (appName) {
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
