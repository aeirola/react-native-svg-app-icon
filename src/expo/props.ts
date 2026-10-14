import * as fse from "fs-extra";
import { Config } from "../lib";
import { ExportedConfigWithProps } from "expo/config-plugins";
import path from "node:path";

export const PluginProps = Config.pick("foregroundPath", "backgroundPath").partial();

export type PluginProps = typeof PluginProps.inferIn;

const defaultForegroundPath = "./icon.svg";
const defaultBackgroundPath = "./icon-background.svg";

export async function resolveProps(
  config: ExportedConfigWithProps,
  props: PluginProps = {},
): Promise<Pick<Config, "projectRoot" | "foregroundPath" | "backgroundPath">> {
  const { foregroundPath = defaultForegroundPath } = props;
  let { backgroundPath } = props;

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
