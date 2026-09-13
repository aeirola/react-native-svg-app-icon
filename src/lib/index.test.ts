import * as fse from "fs-extra";
import * as path from "node:path";
import { describe, expect, it as baseIt } from "vitest";
import { generate } from "./index";

import { tmpDir } from "../../test/utils/tmp-dir";

const it = baseIt.extend({ tmpDir });

describe("lib/index", () => {
  it("throws when projectRoot is not absolute", async () => {
    const generatedFiles = generate(
      {
        projectRoot: "relative/path",
        platforms: [],
        force: false,
        androidOutputPath: "./android/app/src/main/res",
        foregroundPath: path.join(__dirname, "..", "..", "test", "assets", "react-icon.svg"),
      },
      undefined,
    );

    await expect(generatedFiles).rejects.toThrow("projectRoot must be an absolute path");
  });

  it("returns absolute generated files and omits cache hits", async ({ tmpDir }) => {
    const fixtureDir = path.join(__dirname, "..", "..", "test", "integration", "assets", "normal");
    const expectedDir = path.join(fixtureDir, "expected");

    await fse.copy(path.join(fixtureDir, "input"), tmpDir, { overwrite: true });

    const expectedFiles = (await fse.readdir(expectedDir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(tmpDir, path.relative(expectedDir, entry.parentPath), entry.name))
      .sort();

    const firstResult = await generate(
      {
        projectRoot: tmpDir,
        platforms: ["android", "ios"],
        force: false,
        foregroundPath: "./icon/foreground.svg",
        backgroundPath: "./icon/background.svg",
      },
      undefined,
    );

    expect(firstResult.generatedFiles.toSorted()).toEqual(expectedFiles);

    const secondResult = await generate(
      {
        projectRoot: tmpDir,
        platforms: ["android", "ios"],
        force: false,
        foregroundPath: "./icon/foreground.svg",
        backgroundPath: "./icon/background.svg",
      },
      undefined,
    );

    expect(secondResult).toEqual({ generatedFiles: [] });
  });
});
