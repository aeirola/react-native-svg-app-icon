import * as path from "node:path";

/** Returns true if `childPath` is strictly inside `parentPath` (not equal to it). */
export function isSubpathOf(childPath: string, parentPath: string): boolean {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
