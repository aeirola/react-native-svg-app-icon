import {
  type ConfigPlugin,
  IOSConfig,
  WarningAggregator,
  withXcodeProject,
} from "expo/config-plugins";
import type { Context } from "./context";
import { isSubpathOf } from "../util/subpath";
import path from "node:path";

/** Returns the app icon name, or undefined if the output path isn't an `<name>.appiconset` directory. */
function getAppIconName(
  outputPath: string | undefined,
  projectDirectory: string,
): string | undefined {
  // Only catalogs inside the app target's directory are part of the target's resources.
  if (outputPath === undefined || !isSubpathOf(outputPath, projectDirectory)) {
    return undefined;
  }
  // The asset catalog must be a direct parent, otherwise Xcode won't find the icon set.
  if (!path.basename(path.dirname(outputPath)).endsWith(".xcassets")) {
    return undefined;
  }
  if (path.extname(outputPath) !== ".appiconset") {
    return undefined;
  }
  return path.basename(outputPath, ".appiconset") || undefined;
}

/**
 * Sets the generated app icon set as the app icon of the Xcode project target.
 *
 * Mirrors the app icon name handling of Expo's own iOS icon plugin.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withIosIcons.ts
 */
const withAppIconName: ConfigPlugin<{ context: Context }> = (config, { context }) =>
  withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    if (!projectName) {
      throw new Error("iOS project name is not defined in the Expo config.");
    }

    const appIconName = getAppIconName(
      context.outputPath,
      path.join(config.modRequest.platformProjectRoot, projectName),
    );
    if (appIconName === undefined) {
      WarningAggregator.addWarningIOS(
        "svg-app-icon",
        `Output path "${context.outputPath}" is not an "<name>.appiconset" directory in an ".xcassets" catalog inside the app target directory, leaving the Xcode app icon name unchanged.`,
      );
      return config;
    }

    const [, target] = IOSConfig.Target.findNativeTargetByName(config.modResults, projectName);
    const buildConfigurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      config.modResults,
      target.buildConfigurationList,
    );

    for (const [, buildConfiguration] of buildConfigurations) {
      if (buildConfiguration.buildSettings) {
        buildConfiguration.buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = appIconName;
      }
    }

    return config;
  });

export default withAppIconName;
