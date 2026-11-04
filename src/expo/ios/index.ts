import { type ConfigPlugin, type StaticPlugin, withPlugins } from "expo/config-plugins";
import type { Context } from "./context";
import type { PluginProps } from "../props";
import withAppIconName from "./withAppIconName";
import withGenerateIcons from "./withGenerateIcons";
import withRemovedLeftoverFiles from "./withRemovedLeftoverFiles";

/**
 * Overwrites the iOS icon handling of Expo's default plugins.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withIosIcons.ts
 */
const withIosPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  const context: Context = { generatedFiles: [], outputPath: undefined };

  const plugins: StaticPlugin[] = [
    [withGenerateIcons, { props, context }],
    [withRemovedLeftoverFiles, { context }],
    [withAppIconName, {}],
  ];

  // Mods run in reverse registration order, so reverse the natural execution order.
  return withPlugins(config, plugins.toReversed());
};

export default withIosPlugin;
