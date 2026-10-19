import type { ExportedConfigWithProps } from "expo/config-plugins";
import path from "node:path";

export function getAppIconSetPath(config: ExportedConfigWithProps): string {
  if (!config.modRequest.projectName) {
    throw new Error("iOS project name is not defined in the Expo config.");
  }

  return path.join(
    config.modRequest.platformProjectRoot,
    config.modRequest.projectName,
    "Images.xcassets", // TODO: Not a safe assumption in all projects
    "AppIcon.appiconset", // TODO: Should come from the plugin context
  );
}
