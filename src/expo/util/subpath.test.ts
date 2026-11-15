import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { isSubpathOf } from "./subpath";

describe("isSubpathOf", () => {
  const root = path.resolve("/project/ios");

  it("accepts nested paths", () => {
    expect(isSubpathOf(path.join(root, "App", "Icon.appiconset"), root)).toBe(true);
    expect(isSubpathOf(path.join(root, "a"), root)).toBe(true);
  });

  it("rejects the same path", () => {
    expect(isSubpathOf(root, root)).toBe(false);
    expect(isSubpathOf(`${root}${path.sep}`, root)).toBe(false);
  });

  it("rejects parent and sibling paths", () => {
    expect(isSubpathOf(path.dirname(root), root)).toBe(false);
    expect(isSubpathOf(path.resolve("/project/ios-other"), root)).toBe(false);
    expect(isSubpathOf(path.join(root, "..", "android"), root)).toBe(false);
  });

  it("accepts names that merely start with two dots", () => {
    expect(isSubpathOf(path.join(root, "..foo"), root)).toBe(true);
  });

  it("resolves traversal segments", () => {
    expect(isSubpathOf(path.join(root, "a", "..", ".."), root)).toBe(false);
    expect(isSubpathOf(path.join(root, "a", "..", "b"), root)).toBe(true);
  });
});
