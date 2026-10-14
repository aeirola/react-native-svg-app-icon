import type { ConfigPlugin } from "expo/config-plugins";
import { PluginProps } from "./props";
import { type } from "arktype";
import withAndroidPlugin from "./withAndroidPlugin";
import withIosPlugin from "./withIosPlugin";

export type { PluginProps };

const withPlugin: ConfigPlugin<PluginProps | undefined> = (config, props = {}) => {
  const validatedProps = PluginProps(props);
  if (validatedProps instanceof type.errors) {
    throw new Error(
      `Failed to configure react-native-svg-app-icon plugin: ${validatedProps.summary}`,
    );
  }

  config = withAndroidPlugin(config, validatedProps);
  return withIosPlugin(config, validatedProps);
};

export default withPlugin;
