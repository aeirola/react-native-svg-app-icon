import type { ConfigPlugin } from "expo/config-plugins";
import type { PluginOptions } from "./options";
import withAndroidPlugin from "./withAndroidPlugin";
import withIosPlugin from "./withIosPlugin";

export type { PluginOptions };

const withPlugin: ConfigPlugin<PluginOptions> = (config, options) => {
  config = withAndroidPlugin(config, options);
  return withIosPlugin(config, options);
};

export default withPlugin;
