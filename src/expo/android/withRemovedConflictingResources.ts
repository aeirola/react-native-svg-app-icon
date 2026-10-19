import * as fse from "fs-extra";
import { type ConfigPlugin, withDangerousMod } from "expo/config-plugins";
import { getResourceKey, getResourcePath } from "./resources";
import type { Context } from "./context";
import path from "node:path";

/**
 * Removes launcher resources that conflict with the generated ones.
 *
 * Expo's own icon generation can't be disabled, so the base project contains
 * launcher icons we didn't generate. The Android build fails on multiple
 * resources with the same name and qualifiers but different file extensions
 * (e.g. `ic_launcher.webp` next to our `ic_launcher.png`), so anything left by
 * the Expo base template that clashes with our generated files must be removed.
 *
 * Mods run in reverse order of registration, so this must be registered before
 * the generation plugin to run after it, which fills `context.generatedFiles`.
 *
 * @see https://github.com/expo/expo/blob/main/packages/%40expo/prebuild-config/src/plugins/icons/withAndroidIcons.ts
 */
const withRemovedConflictingResources: ConfigPlugin<{ context: Context }> = (config, { context }) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const resourcePath = path.resolve(getResourcePath(config));
      const generatedFilePaths = new Set(
        context.generatedFiles.map((filePath) => path.resolve(filePath)),
      );
      const generatedResources: Set<string | undefined> = new Set(
        [...generatedFilePaths]
          .map((filePath) => getResourceKey(resourcePath, filePath))
          .filter((key): key is string => key !== undefined),
      );

      for (const resource of await fse.readdir(resourcePath, {
        recursive: true,
        withFileTypes: true,
      })) {
        if (!resource.isFile()) {
          continue;
        }

        const resourceFilePath = path.resolve(resource.parentPath, resource.name);
        if (generatedFilePaths.has(resourceFilePath)) {
          continue;
        }

        const resourceKey = getResourceKey(resourcePath, resourceFilePath);
        if (generatedResources.has(resourceKey)) {
          await fse.remove(resourceFilePath);
        }
      }

      return config;
    },
  ]);

export default withRemovedConflictingResources;
