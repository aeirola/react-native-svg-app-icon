import * as commander from "commander";
import * as fse from "fs-extra";
import type * as reactNativeSvgAppIcon from "../index";
import type { LogLevel } from "../util/logger";

/**
 * Configuration values for CLI.
 *
 * Note that these are different from the internal configuration object.
 */
export type CliConfig = {
	backgroundPath: string;
	foregroundPath: string;
	platforms: reactNativeSvgAppIcon.Platform[];
	force: boolean;
	androidOutputPath: string;
	iosOutputPath?: string;
	appName?: string;
	logLevel: LogLevel;
};

/**
 * Custom extension of RN / Expo app.json for file based configuration.
 */
type AppJson = Partial<{
	name: string;
	displayName: string;
	svgAppIcon: Partial<CliConfig>;
}>;

/**
 * Default values for CLI configuration. Custom values are merged on top.
 */
export const defaultConfig: CliConfig = {
	backgroundPath: "./icon-background.svg",
	foregroundPath: "./icon.svg",
	platforms: ["android", "ios"],
	force: false,
	androidOutputPath: "./android/app/src/main/res",
	logLevel: "info",
};

export async function readFileConfig(): Promise<Partial<CliConfig>> {
	try {
		const appJson = (await fse.readJson("./app.json")) as AppJson;
		return {
			...(appJson.name ? { appName: appJson.name } : {}),
			...appJson.svgAppIcon,
		};
	} catch {
		return {};
	}
}

export function readArgsConfig(args: string[]): Partial<CliConfig> {
	const program = new commander.Command();

	program
		.name("react-native-svg-app-icon")
		.option("--background-path <path>", "background icon path")
		.option("--foreground-path <path>", "foreground icon path")
		.option(
			"--platforms <platforms...>",
			"platforms for which to generate icons",
		)
		.option("-f, --force", "overwrite existing newer files")
		.option("--android-output-path <path>", "android output path")
		.option("--ios-output-path <path>", "ios output path")
		.addOption(
			new commander.Option("--log-level <level>", "log level").choices([
				"silent",
				"error",
				"warn",
				"info",
				"debug",
			]),
		)
		.parse(args);

	return program.opts();
}
