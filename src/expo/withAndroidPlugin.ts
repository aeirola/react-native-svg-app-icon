import * as fse from "fs-extra";
import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { type PluginOptions, resolveOptions } from "./options";
import { generate } from "../lib";
import path from "node:path";

/** Used to remove extra launcher resources that are not generated.
 *
 * Needs to match both expo configuration and lib icon generation.
 *
 * Should be refactored to read / set expo value, and configure lib icon generation.
 */
const launcherResourceNames = new Set(["ic_launcher", "ic_launcher_round"]);

const withAndroidPlugin: ConfigPlugin<PluginOptions> = (config, options) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const resolvedOptions = await resolveOptions(config, options);

      const resourcePath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      if (config.modRequest.introspect) {
        return config;
      }

      const { generatedFiles } = await generate(
        {
          ...resolvedOptions,
          platforms: ["android"],
          androidOutputPath: resourcePath,
          force: true,
        },
        undefined,
      );

      await removeExtraLauncherResources(resourcePath, generatedFiles);

      return config;
    },
  ]);

async function removeExtraLauncherResources(
  resourcePath: string,
  generatedFiles: readonly string[],
): Promise<void> {
  const generatedFilePaths = new Set(generatedFiles.map((filePath) => path.resolve(filePath)));

  for (const resource of await fse.readdir(resourcePath, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!resource.isFile()) {
      continue;
    }

    const resourceDirectory = path.relative(resourcePath, resource.parentPath);
    if (path.dirname(resourceDirectory) !== "." || !/^mipmap(?:-.+)?$/i.test(resourceDirectory)) {
      continue;
    }

    const resourceName = resource.name.replace(/(?:\.9)?\.[^.]+$/, "");
    const resourceFilePath = path.join(resource.parentPath, resource.name);
    if (
      launcherResourceNames.has(resourceName) &&
      !generatedFilePaths.has(path.resolve(resourceFilePath))
    ) {
      await fse.remove(resourceFilePath);
    }
  }
}

export default withAndroidPlugin;
