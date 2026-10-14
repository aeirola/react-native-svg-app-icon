import * as fse from "fs-extra";
import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { type PluginProps, resolveProps } from "./props";
import { generate } from "../lib";
import path from "node:path";

const withIosPlugin: ConfigPlugin<PluginProps> = (config, props) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const resolvedProps = await resolveProps(config, props);

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
          ...resolvedProps,
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
