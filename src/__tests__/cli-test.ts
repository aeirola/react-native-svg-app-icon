import * as path from "path";
import * as fse from "fs-extra";
import * as tmp from "tmp";

import main from "../cli";

describe("cli", () => {
  const fixturesPath = path.join(__dirname, "fixtures");

  let tmpDir: tmp.DirResult;
  beforeEach(() => {
    jest.spyOn(global.console, "log").mockImplementation();
    jest.spyOn(global.console, "debug").mockImplementation();

    tmpDir = tmp.dirSync({
      unsafeCleanup: true
    });
    process.chdir(tmpDir.name);
  });
  afterEach(() => {
    tmpDir.removeCallback();
  });

  it("fails on missing file", async () => {
    await expect(main()).rejects.toThrow("no such file or directory");
  });

  it("does not fail for existing file", async () => {
    await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));
    await fse.writeJson("app.json", {
      svgAppIcon: {
        backgroundPath: path.join(
          fixturesPath,
          "example",
          "icon-background.svg"
        ),
        foregroundPath: path.join(fixturesPath, "example", "icon.svg")
      }
    });

    await expect(main()).resolves.toBeUndefined();
  });

  it("reads icon path from arguments", async () => {
    await fse.ensureDir(path.join("ios", "project", "Images.xcassets"));

    await expect(
      main([
        "/usr/local/bin/node",
        "cli.js",
        `--foreground-path=${path.join(fixturesPath, "example", "icon.svg")}`
      ])
    ).resolves.toBeUndefined();
  });
});
