import * as fse from "fs-extra";
import type { Config } from "../lib";
import { ExportedConfigWithProps } from "expo/config-plugins";
import path from "node:path";

export type PluginOptions = Pick<Partial<Config>, "foregroundPath" | "backgroundPath"> | undefined;

const defaultForegroundPath = "./icon.svg";
const defaultBackgroundPath = "./icon-background.svg";

export async function resolveOptions(
  config: ExportedConfigWithProps,
  options: PluginOptions = {},
): Promise<Pick<Config, "projectRoot" | "foregroundPath" | "backgroundPath">> {
  const { foregroundPath = defaultForegroundPath } = options;
  let { backgroundPath } = options;

  if (
    backgroundPath === undefined &&
    (await fse.pathExists(path.resolve(config.modRequest.projectRoot, defaultBackgroundPath)))
  ) {
    backgroundPath = defaultBackgroundPath;
  }

  return {
    projectRoot: config.modRequest.projectRoot,
    foregroundPath,
    ...(backgroundPath !== undefined ? { backgroundPath } : {}),
  };
}
