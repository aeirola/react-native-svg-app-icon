#!/usr/bin/env node
import * as fse from "fs-extra";

import * as reactNativeSvgAppIcon from "../index";
import { createLogger } from "../util/logger";
import {
	type CliConfig,
	defaultConfig,
	readArgsConfig,
	readFileConfig,
} from "./config";

const supportedPlatforms: reactNativeSvgAppIcon.Platform[] = ["android", "ios"];

export async function main(args: string[] = []): Promise<void> {
	const cliConfig: CliConfig = {
		...defaultConfig,
		...(await readFileConfig()),
		...readArgsConfig(args),
	};

	// Create logger from config
	const logger = createLogger(cliConfig.logLevel);

	logger.info("Running react-native-svg-app-icon");

	if (!(await fse.pathExists(cliConfig.foregroundPath))) {
		throw Error(
			`Icon is required, but not found at ${cliConfig.foregroundPath}`,
		);
	}

	cliConfig.platforms = cliConfig.platforms
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
			backgroundPath: (await fse.pathExists(cliConfig.backgroundPath))
				? cliConfig.backgroundPath
				: undefined,
			foregroundPath: cliConfig.foregroundPath,
		},
		platforms: cliConfig.platforms,
		force: cliConfig.force,
		androidOutputPath: cliConfig.androidOutputPath,
		iosOutputPath: cliConfig.iosOutputPath,
		appName: cliConfig.appName,
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
