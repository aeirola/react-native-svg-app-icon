#!/usr/bin/env node
import * as commander from "commander";
import * as fse from "fs-extra";

import * as reactNativeSvgAppIcon from "./index";

/**
 * Configuration values for CLI.
 *
 * Note that these are different from the internal configuration object.
 */
type CliConfig = {
  backgroundPath: string;
  foregroundPath: string;
  platforms: reactNativeSvgAppIcon.Platform[];
  force: boolean;
  androidOutputPath: string;
  iosOutputPath?: string;
};

/**
 * Custom extension of RN / Expo app.json for file based configuration.
 */
type AppJson = Partial<{
  name: string;
  displayName: string;
  svgAppIcon: Partial<CliConfig>;
}>;

const supportedPlatforms: reactNativeSvgAppIcon.Platform[] = ["android", "ios"];

/**
 * Default values for CLI configuration. Custom values are merged on top.
 */
const defaultConfig: CliConfig = {
  backgroundPath: "./icon-background.svg",
  foregroundPath: "./icon.svg",
  platforms: supportedPlatforms,
  force: false,
  androidOutputPath: "./android/app/src/main/res"
};

async function main(args: string[] = []): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  const cliConfig: CliConfig = {
    ...defaultConfig,
    ...(await readFileConfig()),
    ...readArgsConfig(args)
  };

  if (!(await fse.pathExists(cliConfig.foregroundPath))) {
    throw Error(
      `Icon is required, but not found at ${cliConfig.foregroundPath}`
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

  const generatedFiles = reactNativeSvgAppIcon.generate({
    icon: {
      backgroundPath: (await fse.pathExists(cliConfig.backgroundPath))
        ? cliConfig.backgroundPath
        : undefined,
      foregroundPath: cliConfig.foregroundPath
    },
    platforms: cliConfig.platforms,
    force: cliConfig.force,
    androidOutputPath: cliConfig.androidOutputPath,
    iosOutputPath: cliConfig.iosOutputPath
  });

  for await (const file of generatedFiles) {
    console.log("Wrote " + file);
  }
  console.log("Done");
}

async function readFileConfig(): Promise<Partial<CliConfig>> {
  try {
    const appJson = (await fse.readJson("./app.json")) as AppJson;
    return appJson.svgAppIcon || {};
  } catch (error) {
    return {};
  }
}

function readArgsConfig(args: string[]): Partial<CliConfig> {
  const program = new commander.Command();

  program
    .name("react-native-svg-app-icon")
    .option("--background-path <path>", "background icon path")
    .option("--foreground-path <path>", "foreground icon path")
    .option(
      "--platforms <platforms...>",
      "platforms for which to generate icons"
    )
    .option("-f, --force", "overwrite existing newer files")
    .option("--android-output-path <path>", "android output path")
    .option("--ios-output-path <path>", "ios output path")
    .parse(args);

  return program.opts();
}

if (require.main === module) {
  main(process.argv).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default main;
