import * as path from "node:path";
import * as fse from "fs-extra";
import type { OutputConfig } from "../util/output";

export interface Config extends OutputConfig {
	iosOutputPath: string;
}

export async function getConfig(
	iosOutputPath?: string,
	force?: boolean,
): Promise<Config> {
	return {
		iosOutputPath: iosOutputPath || (await getIconsetDir()),
		force: force || false,
	};
}

async function getIconsetDir(): Promise<string> {
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
