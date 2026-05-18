import * as fse from "fs-extra";
import * as path from "node:path";
import { it as base, describe, expect } from "vitest";
import { getConfig } from "./config";

import { tmpDir } from "../../../test/utils/tmp-dir";

const it = base.extend({ tmpDir });

describe("ios/config", () => {
  describe("getConfig", () => {
    it("uses provided iosOutputPath", async ({ tmpDir }) => {
      const customPath = path.resolve("/custom", "path");
      const config = await getConfig(
        {
          iosOutputPath: customPath,
          projectRoot: tmpDir,
        },
        undefined,
      );

      expect(config.iosOutputPath).toBe(customPath);
    });

    it("resolves relative iosOutputPath against projectRoot", async ({ tmpDir }) => {
      const config = await getConfig(
        {
          iosOutputPath: path.join("ios", "App", "Images.xcassets"),
          projectRoot: tmpDir,
        },
        undefined,
      );

      expect(config.iosOutputPath).toBe(path.join(tmpDir, "ios", "App", "Images.xcassets"));
    });

    it("finds Images.xcassets directory and returns AppIcon.appiconset path", async ({
      tmpDir,
    }) => {
      // Create Images.xcassets directory structure
      await fse.ensureDir(path.join("ios", "MyProject", "Images.xcassets"));

      const config = await getConfig({ projectRoot: tmpDir }, undefined);

      expect(config.iosOutputPath).toBe(
        path.join(tmpDir, "ios", "MyProject", "Images.xcassets", "AppIcon.appiconset"),
      );
    });

    it("finds Images.xcassets for project with space in name", async ({ tmpDir }) => {
      await fse.ensureDir(path.join("ios", "My App", "Images.xcassets"));

      const config = await getConfig({ projectRoot: tmpDir }, undefined);

      expect(config.iosOutputPath).toBe(
        path.join(tmpDir, "ios", "My App", "Images.xcassets", "AppIcon.appiconset"),
      );
    });

    it("prefers directory matching app name over other matches", async ({ tmpDir }) => {
      // Both directories have Images.xcassets, but app name should win
      await fse.ensureDir(path.join("ios", "My", "Images.xcassets"));
      await fse.ensureDir(path.join("ios", "My App", "Images.xcassets"));

      const config = await getConfig({ appName: "My App", projectRoot: tmpDir }, undefined);

      expect(config.iosOutputPath).toBe(
        path.join(tmpDir, "ios", "My App", "Images.xcassets", "AppIcon.appiconset"),
      );
    });

    it("falls back to directory scan when app name does not match", async ({ tmpDir }) => {
      await fse.ensureDir(path.join("ios", "ActualProject", "Images.xcassets"));

      const config = await getConfig(
        {
          appName: "DifferentName",
          projectRoot: tmpDir,
        },
        undefined,
      );

      expect(config.iosOutputPath).toBe(
        path.join(tmpDir, "ios", "ActualProject", "Images.xcassets", "AppIcon.appiconset"),
      );
    });

    it("throws error when Images.xcassets directory does not exist", async ({ tmpDir }) => {
      // Create ios directory but no Images.xcassets
      await fse.ensureDir(path.join("ios", "MyProject"));

      await expect(getConfig({ projectRoot: tmpDir }, undefined)).rejects.toThrow(
        "No Images.xcassets found under ios/ subdirectories",
      );
    });
  });
});
