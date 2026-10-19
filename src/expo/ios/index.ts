import { type ConfigPlugin, withPlugins } from "expo/config-plugins";
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
  const context: Context = { generatedFiles: [] };

  return withPlugins(config, [
    [withRemovedLeftoverFiles, { context }],
    [withGenerateIcons, { props, context }],
    [withAppIconName, {}],
  ]);
};

export default withIosPlugin;
