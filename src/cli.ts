#!/usr/bin/env node
import * as coa from "coa";
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
  platforms: Platform[];
  force: boolean;
  androidOutputPath: string;
  iosOutputPath?: string;
};

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

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
const defaultConfig: CliConfig = {
  backgroundPath: "./icon-background.svg",
  foregroundPath: "./icon.svg",
  platforms: ["android", "ios"],
  force: false,
  androidOutputPath: "./android/app/src/main/res"
};

async function main(args: string[] = []): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  const cliConfig: CliConfig = {
    ...defaultConfig,
    ...(await readFileConfig()),
    ...(await readArgsConfig(args))
  };

  cliConfig.platforms = cliConfig.platforms.map(
    (platform) => platform.toLowerCase() as Platform
  );

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

async function readArgsConfig(args: string[]): Promise<Partial<CliConfig>> {
  return new Promise((resolve) =>
    coa
      .Cmd()
      .name("react-native-svg-app-icon")
      .helpful()
      // --background-path
      .opt()
      .name("backgroundPath")
      .title("Background path")
      .long("background-path")
      .end()
      // --foreground-path
      .opt()
      .name("foregroundPath")
      .title("Foreground path")
      .long("foreground-path")
      .end()
      // --platform
      .opt()
      .name("platforms")
      .title("Platform")
      .long("platform")
      .arr()
      .end()
      // --force
      .opt()
      .name("force")
      .title("Force")
      .long("force")
      .short("f")
      .flag()
      .end()
      // --android-output-path
      .opt()
      .name("androidOutputPath")
      .title("Android Output Path")
      .long("android-output-path")
      .end()
      // --ios-output-path
      .opt()
      .name("iosOutputPath")
      .title("iOS Output Path")
      .long("ios-output-path")
      .end()
      .act(resolve)
      .run(args.slice(2))
  );
}

if (require.main === module) {
  void main(process.argv);
}

export default main;
