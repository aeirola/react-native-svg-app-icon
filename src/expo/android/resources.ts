import type { ExportedConfigWithProps } from "expo/config-plugins";
import path from "node:path";
import { regex } from "arkregex";

export function getResourcePath(config: ExportedConfigWithProps): string {
  return path.join(config.modRequest.platformProjectRoot, "app", "src", "main", "res");
}

/**
 *  Matches Android resource file paths relative to the res dir.
 *
 * The pattern is `<type>[-<qualifiers>]/<name>[.9].<ext>`
 * e.g. `mipmap-hdpi/ic_launcher.png`
 *
 * @see https://developer.android.com/guide/topics/resources/providing-resources
 */
const resourceFileRegex = regex(
  "^(?<type>[^/-]+)(?<qualifiers>-[^/]+)?/(?<name>[^/]+?)(?<ninePatch>\\.9)?\\.(?<extension>[^./]+)$",
  "i",
);

export function getResourceKey(resourcePath: string, filePath: string): string | undefined {
  const relative = path.relative(resourcePath, filePath).split(path.sep).join("/");
  const groups = resourceFileRegex.exec(relative)?.groups;
  return groups && `${groups.type.toLowerCase()}/${groups.name}`;
}
