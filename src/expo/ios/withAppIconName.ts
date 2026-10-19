import { type ConfigPlugin, IOSConfig, withXcodeProject } from "expo/config-plugins";

/** Needs to match the name of the generated `<name>.appiconset` directory. */
const appIconName = "AppIcon"; // TODO: Should come from the plugin context

/**
 * Sets the generated app icon set as the app icon of the Xcode project target.
 *
 * Mirrors the app icon name handling of Expo's own iOS icon plugin.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withIosIcons.ts
 */
const withAppIconName: ConfigPlugin = (config) =>
  withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    if (!projectName) {
      throw new Error("iOS project name is not defined in the Expo config.");
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
