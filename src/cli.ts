#!/usr/bin/env node
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
const defaultCliConfig: CliConfig = {
  backgroundPath: "./icon-background.svg",
  foregroundPath: "./icon.svg"
};

async function main(): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  let cliConfig: CliConfig;
  try {
    const appJson = (await fse.readJson("./app.json")) as AppJson;
    cliConfig = {
      ...defaultCliConfig,
      ...appJson.svgAppIcon
    };
  } catch {
    cliConfig = defaultCliConfig;
  }

  const generatedFiles = await reactNativeSvgAppIcon.generate({
    icon: {
      backgroundPath: (await fse.pathExists(cliConfig.backgroundPath))
        ? cliConfig.backgroundPath
        : undefined,
      foregroundPath: cliConfig.foregroundPath
    }
  });

  for await (const file of generatedFiles) {
    console.log("Wrote " + file);
  }
  console.log("Done");
}

if (require.main === module) {
  void main();
}

export default main;
