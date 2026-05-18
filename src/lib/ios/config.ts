import * as fse from "fs-extra";
import * as path from "node:path";
import { BaseConfig } from "../config/base";
import type { Logger } from "../util/logger";
import { type } from "arktype";

export const IosConfig = type.merge(
  BaseConfig,
  type({
    "iosOutputPath?": "string",
    "appName?": "string",
  }),
);

export type IosConfig = typeof IosConfig.infer;
export type ResolvedConfig = Required<Pick<IosConfig, "iosOutputPath">>;

export async function getConfig(
  config: IosConfig,
  logger: Logger | undefined,
): Promise<ResolvedConfig> {
  if (config.iosOutputPath) {
    logger?.debug(`Using configured iOS output path: ${config.iosOutputPath}`);
  }

  return {
    iosOutputPath: config.iosOutputPath
      ? path.resolve(config.projectRoot, config.iosOutputPath)
      : await getIconsetDir(config, logger),
  };
}

async function getIconsetDir(
  { appName, projectRoot }: IosConfig,
  logger: Logger | undefined,
): Promise<string> {
  // Prefer the directory matching the app name from app.json, to avoid
  // picking a wrong subdirectory when multiple matches exist (e.g. "My"
  // vs "My App").
  if (appName && !appName.includes(path.sep) && appName !== ".." && appName !== ".") {
    const preferredPath = path.resolve(projectRoot, "ios", appName, "Images.xcassets");
    if ((await fse.pathExists(preferredPath)) && (await fse.stat(preferredPath)).isDirectory()) {
      const result = path.join(preferredPath, "AppIcon.appiconset");
      logger?.debug(`Auto-detected iOS output path from app name "${appName}": ${result}`);
      return result;
    }
  }

  for (const fileName of await fse.readdir(path.resolve(projectRoot, "ios"))) {
    const testPath = path.resolve(projectRoot, "ios", fileName, "Images.xcassets");
    if ((await fse.pathExists(testPath)) && (await fse.stat(testPath)).isDirectory()) {
      const result = path.join(testPath, "AppIcon.appiconset");
      logger?.debug(`Auto-detected iOS output path from directory scan: ${result}`);
      return result;
    }
  }

  throw new Error("No Images.xcassets found under ios/ subdirectories");
}
