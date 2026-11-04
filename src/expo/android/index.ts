import { type ConfigPlugin, type StaticPlugin, withPlugins } from "expo/config-plugins";
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
  const context: Context = { generatedFiles: [], outputPath: undefined };

  const plugins: StaticPlugin[] = [
    [withGenerateIcons, { props, context }],
    [withRemovedConflictingResources, { context }],
    [withLauncherIconManifest, {}],
  ];

  // Mods run in reverse registration order, so reverse the natural execution order.
  return withPlugins(config, plugins.toReversed());
};

export default withAndroidPlugin;
