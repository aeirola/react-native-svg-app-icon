import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { type PluginProps, resolveProps } from "../props";
import type { Context } from "./context";
import { generate } from "../../lib";
import { getResourcePath } from "./resources";

/**
 * Generates the icon resources, and records the generated files in `context`.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withAndroidIcons.ts
 */
const withGenerateIcons: ConfigPlugin<{ props: PluginProps; context: Context }> = (
  config,
  { props, context },
) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const resolvedProps = await resolveProps(config, props);

      const { generatedFiles } = await generate(
        {
          ...resolvedProps,
          platforms: ["android"],
          androidOutputPath: getResourcePath(config), // TODO: Should allow user override
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
