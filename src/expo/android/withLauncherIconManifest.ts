import { AndroidConfig, type ConfigPlugin, withAndroidManifest } from "expo/config-plugins";

/**
 * Needs to match the generated resources.
 *
 * Should add support for custom launcher icon names in the lib, and set them
 * from the Expo configuration.
 */
const iconName = "ic_launcher"; // TODO: Should come from the plugin context
const roundIconName = "ic_launcher_round"; // TODO: Should come from the plugin context

/**
 * Points the manifest to the generated launcher icons.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withAndroidManifestIcons.ts
 */
const withLauncherIconManifest: ConfigPlugin = (config) =>
  withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$["android:icon"] = `@mipmap/${iconName}`;
    application.$["android:roundIcon"] = `@mipmap/${roundIconName}`;
    return config;
  });

export default withLauncherIconManifest;
