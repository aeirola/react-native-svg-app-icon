#!/usr/bin/env node
import * as reactNativeSvgAppIcon from "../lib";
import { resolveConfig } from "./config";
import { createLogger } from "./logger";

export async function main(args: string[] = []): Promise<void> {
	const resolvedConfig = await resolveConfig(args);

	// Create logger from config
	const logger = createLogger(resolvedConfig.logLevel);

	logger?.info("Running react-native-svg-app-icon");

	const config: reactNativeSvgAppIcon.Config = {
		icon: {
			backgroundPath: resolvedConfig.backgroundPath,
			foregroundPath: resolvedConfig.foregroundPath,
		},
		platforms: resolvedConfig.platforms,
		force: resolvedConfig.force,
		androidOutputPath: resolvedConfig.androidOutputPath,
		iosOutputPath: resolvedConfig.iosOutputPath,
		appName: resolvedConfig.appName,
	};

	const generatedFiles = reactNativeSvgAppIcon.generate(config, logger);

	for await (const file of generatedFiles) {
		logger?.info(`Wrote ${file}`);
	}
	logger?.info("Done");
}

if (require.main === module) {
	main(process.argv).catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

export default main;
