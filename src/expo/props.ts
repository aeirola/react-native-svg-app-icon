import * as fse from "fs-extra";
import { Config } from "../lib";
import { ExportedConfigWithProps } from "expo/config-plugins";
import path from "node:path";

export const PluginProps = Config.omit("projectRoot", "force").partial();

export type PluginProps = typeof PluginProps.inferIn;

const defaultForegroundPath = "./icon.svg";
const defaultBackgroundPath = "./icon-background.svg";

export async function resolveProps(
  config: ExportedConfigWithProps,
  props: PluginProps = {},
): Promise<Config> {
  const { foregroundPath = defaultForegroundPath, ...rest } = props;
  let { backgroundPath } = props;

  if (
    backgroundPath === undefined &&
    (await fse.pathExists(path.resolve(config.modRequest.projectRoot, defaultBackgroundPath)))
  ) {
    backgroundPath = defaultBackgroundPath;
  }

  return {
    ...rest,
    projectRoot: config.modRequest.projectRoot,
    foregroundPath,
    ...(backgroundPath !== undefined ? { backgroundPath } : {}),
  };
}
