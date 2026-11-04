import * as fse from "fs-extra";
import * as path from "node:path";
import { describe, it } from "vitest";

import { cleanupTestOutputs } from "../../utils/cleanup";
import { regex } from "arkregex";
import { runExpo } from "../../utils/expo-runner";
import { verifyGeneratedFiles } from "../../utils/file-comparison";

describe("Expo integration tests", () => {
  const fixtureBaseDir = path.join(__dirname, "assets");

  async function runPrebuild(platform: "android" | "ios") {
    await cleanupTestOutputs(fixtureBaseDir, [platform]);
    const fixtureDir = path.join(fixtureBaseDir, platform);
    const inputDir = path.join(fixtureDir, "input");
    const outputDir = path.join(fixtureDir, "output");
    await fse.copy(inputDir, outputDir);

    const result = await runExpo(["prebuild", "--no-install", outputDir]);

    if (result.exitCode !== 0) {
      throw new Error(
        `CLI failed with exit code ${result.exitCode}:\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
      );
    }
  }

  it("generates Android icons during prebuild", async () => {
    await runPrebuild("android");
    await verifyGeneratedFiles(path.join(fixtureBaseDir, "android"), {
      imageThreshold: 0.1,
      filter: regex("^android/app/src/main/res/[^/]+/ic_launcher"),
    });
  });

  it.skipIf(process.platform === "win32")("generates iOS icons during prebuild", async () => {
    await runPrebuild("ios");
    await verifyGeneratedFiles(path.join(fixtureBaseDir, "ios"), {
      imageThreshold: 0.1,
      filter: regex("^ios/[^/]+/Images\\.xcassets/AppIcon\\.appiconset/"),
    });
  });
});
