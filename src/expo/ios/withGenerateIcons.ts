import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { type PluginProps, resolveProps } from "../props";
import type { Context } from "./context";
import { generate } from "../../lib";
import { getAppIconSetPath } from "./assets";

/**
 * Generates the icon assets, and records the generated files in `context`.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withIosIcons.ts
 */
const withGenerateIcons: ConfigPlugin<{ props: PluginProps; context: Context }> = (
  config,
  { props, context },
) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const resolvedProps = await resolveProps(config, props);

      const { generatedFiles } = await generate(
        {
          ...resolvedProps,
          platforms: ["ios"],
          iosOutputPath: getAppIconSetPath(config), // TODO: Should allow user override
          // Using force to always output all generated files
          force: true,
        },
        undefined,
      );

      context.generatedFiles = generatedFiles;

      return config;
    },
  ]);

export default withGenerateIcons;
