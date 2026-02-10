#!/usr/bin/env node
import * as fse from "fs-extra";

import * as reactNativeSvgAppIcon from "../index";
import { createLogger } from "../util/logger";
import { readConfig } from "./config";

const supportedPlatforms: reactNativeSvgAppIcon.Platform[] = ["android", "ios"];

export async function main(args: string[] = []): Promise<void> {
	const resolvedConfig = await readConfig(args);

	// Create logger from config
	const logger = createLogger(resolvedConfig.logLevel);

	logger.info("Running react-native-svg-app-icon");

	if (!(await fse.pathExists(resolvedConfig.foregroundPath))) {
		throw Error(
			`Icon is required, but not found at ${resolvedConfig.foregroundPath}`,
		);
	}

	resolvedConfig.platforms = resolvedConfig.platforms
		.map((platform) => platform.toLowerCase())
		.filter((platform): platform is reactNativeSvgAppIcon.Platform => {
			if ((supportedPlatforms as string[]).includes(platform)) {
				return true;
			} else {
				throw Error(`Unsupported platform ${platform}`);
			}
		});

	const config: reactNativeSvgAppIcon.Config = {
		icon: {
			backgroundPath: (await fse.pathExists(resolvedConfig.backgroundPath))
				? resolvedConfig.backgroundPath
				: undefined,
			foregroundPath: resolvedConfig.foregroundPath,
		},
		platforms: resolvedConfig.platforms,
		force: resolvedConfig.force,
		androidOutputPath: resolvedConfig.androidOutputPath,
		iosOutputPath: resolvedConfig.iosOutputPath,
		appName: resolvedConfig.appName,
		logger,
	};

	const generatedFiles = reactNativeSvgAppIcon.generate(config);

	for await (const file of generatedFiles) {
		logger.info(`Wrote ${file}`);
	}
	logger.info("Done");
}

if (require.main === module) {
	main(process.argv).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

export default main;
