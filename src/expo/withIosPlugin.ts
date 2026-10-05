import * as fse from "fs-extra";
import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { type PluginOptions, resolveOptions } from "./options";
import { generate } from "../lib";
import path from "node:path";

const withIosPlugin: ConfigPlugin<PluginOptions> = (config, options) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const resolvedOptions = await resolveOptions(config, options);

      if (!config.modRequest.projectName) {
        throw new Error("iOS project name is not defined in the Expo config.");
      }

      const appIconSetPath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        "Images.xcassets",
        "AppIcon.appiconset",
      );

      if (config.modRequest.introspect) {
        return config;
      }

      const { generatedFiles } = await generate(
        {
          ...resolvedOptions,
          platforms: ["ios"],
          iosOutputPath: appIconSetPath,
          force: true,
        },
        undefined,
      );

      const generatedFilePaths = new Set(generatedFiles.map((filePath) => path.resolve(filePath)));
      await removeUnexpectedFiles(appIconSetPath, generatedFilePaths);

      return config;
    },
  ]);

async function removeUnexpectedFiles(
  directoryPath: string,
  generatedFilePaths: ReadonlySet<string>,
): Promise<void> {
  const entries = await fse.readdir(directoryPath, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(entry.parentPath, entry.name);
    if (!entry.isDirectory() && !generatedFilePaths.has(path.resolve(entryPath))) {
      await fse.remove(entryPath);
    }
  }
}

export default withIosPlugin;
