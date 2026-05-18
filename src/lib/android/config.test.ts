import * as path from "node:path";
import { it as base, describe, expect } from "vitest";
import { getConfig } from "./config";

import { tmpDir } from "../../../test/utils/tmp-dir";

const it = base.extend({ tmpDir });

describe("android/config", () => {
  describe("getConfig", () => {
    it("resolves androidOutputPath relative to projectRoot", async ({ tmpDir }) => {
      const config = getConfig({
        androidOutputPath: path.join("android", "app", "src", "main", "res"),
        projectRoot: tmpDir,
      });

      expect(config.androidOutputPath).toBe(
        path.join(tmpDir, "android", "app", "src", "main", "res"),
      );
    });

    it("keeps absolute androidOutputPath unchanged", async ({ tmpDir }) => {
      const androidOutputPath = path.resolve("/custom", "android", "res");
      const config = getConfig({
        androidOutputPath,
        projectRoot: tmpDir,
      });

      expect(config.androidOutputPath).toBe(androidOutputPath);
    });
  });
});
