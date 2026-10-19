import { type ConfigPlugin, withPlugins } from "expo/config-plugins";
import type { Context } from "./context";
import type { PluginProps } from "../props";
import withGenerateIcons from "./withGenerateIcons";
import withLauncherIconManifest from "./withLauncherIconManifest";
import withRemovedConflictingResources from "./withRemovedConflictingResources";

/**
 * Overwrites the Android icon handling of Expo's default plugins.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withAndroidIcons.ts
 */
const withAndroidPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  const context: Context = { generatedFiles: [] };

  return withPlugins(config, [
    [withRemovedConflictingResources, { context }],
    [withGenerateIcons, { props, context }],
    [withLauncherIconManifest, {}],
  ]);
};

export default withAndroidPlugin;
