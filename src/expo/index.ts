// TODO: Add integration test checks for android manifest xml and xcode project files

import { type ConfigPlugin, withPlugins } from "expo/config-plugins";
import { PluginProps } from "./props";
import { type } from "arktype";
import withAndroidPlugin from "./android";
import withIosPlugin from "./ios";

export type { PluginProps };

const withPlugin: ConfigPlugin<PluginProps | undefined> = (config, props = {}) => {
  const validatedProps = PluginProps(props);
  if (validatedProps instanceof type.errors) {
    throw new Error(
      `Failed to configure react-native-svg-app-icon plugin: ${validatedProps.summary}`,
    );
  }

  const platforms = validatedProps.platforms ?? ["android", "ios"];

  return withPlugins(
    config,
    platforms.map((platform) => {
      switch (platform) {
        case "android":
          return [withAndroidPlugin, validatedProps];
        case "ios":
          return [withIosPlugin, validatedProps];
      }
    }),
  );
};

export default withPlugin;
