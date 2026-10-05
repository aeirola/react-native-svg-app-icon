import * as fse from "fs-extra";
import * as path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { cleanupTestOutputs } from "../../utils/cleanup";
import { runExpo } from "../../utils/expo-runner";

describe("Expo integration tests", () => {
  const fixtureBaseDir = path.join(__dirname, "assets");

  beforeAll(async () => {
    await cleanupTestOutputs(path.join(__dirname, "assets"), ["simple"]);
  });

  it("generates simple icons during prebuild", async () => {
    const fixtureDir = path.join(fixtureBaseDir, "simple");
    const inputDir = path.join(fixtureDir, "input");
    const outputDir = path.join(fixtureDir, "output");
    await fse.copy(inputDir, outputDir);

    const result = await runExpo(["prebuild", "--no-install", outputDir]);

    if (result.exitCode !== 0) {
      throw new Error(
        `CLI failed with exit code ${result.exitCode}:\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
      );
    }

    await expect(
      fse.readdir(path.join(outputDir, "android", "app", "src", "main", "res"), {
        recursive: true,
      }),
    ).resolves.toMatchInlineSnapshot(`
      [
        "drawable",
        "drawable-anydpi-v26",
        "drawable-anydpi-v26/ic_launcher_background.xml",
        "drawable-anydpi-v26/ic_launcher_foreground.xml",
        "drawable-hdpi",
        "drawable-hdpi/splashscreen_logo.png",
        "drawable-mdpi",
        "drawable-mdpi/splashscreen_logo.png",
        "drawable-xhdpi",
        "drawable-xhdpi/splashscreen_logo.png",
        "drawable-xxhdpi",
        "drawable-xxhdpi/splashscreen_logo.png",
        "drawable-xxxhdpi",
        "drawable-xxxhdpi/splashscreen_logo.png",
        "drawable/ic_launcher_background.xml",
        "drawable/rn_edit_text_material.xml",
        "mipmap-anydpi-v26",
        "mipmap-anydpi-v26/ic_launcher.xml",
        "mipmap-anydpi-v26/ic_launcher_round.xml",
        "mipmap-hdpi",
        "mipmap-hdpi/ic_launcher.png",
        "mipmap-hdpi/ic_launcher_round.png",
        "mipmap-mdpi",
        "mipmap-mdpi/ic_launcher.png",
        "mipmap-mdpi/ic_launcher_round.png",
        "mipmap-xhdpi",
        "mipmap-xhdpi/ic_launcher.png",
        "mipmap-xhdpi/ic_launcher_round.png",
        "mipmap-xxhdpi",
        "mipmap-xxhdpi/ic_launcher.png",
        "mipmap-xxhdpi/ic_launcher_round.png",
        "mipmap-xxxhdpi",
        "mipmap-xxxhdpi/ic_launcher.png",
        "mipmap-xxxhdpi/ic_launcher_round.png",
        "values",
        "values/colors.xml",
        "values/strings.xml",
        "values/styles.xml",
      ]
    `);

    await expect(
      fse.readdir(
        path.join(
          outputDir,
          "ios",
          "expointegrationtestfixture",
          "Images.xcassets",
          "AppIcon.appiconset",
        ),
        {
          recursive: true,
        },
      ),
    ).resolves.toMatchInlineSnapshot(`
      [
        "Contents.json",
        "ios-marketing-1024@1x.png",
        "ipad-20@1x.png",
        "ipad-20@2x.png",
        "ipad-29@1x.png",
        "ipad-29@2x.png",
        "ipad-40@1x.png",
        "ipad-40@2x.png",
        "ipad-76@1x.png",
        "ipad-76@2x.png",
        "ipad-83.5@2x.png",
        "iphone-20@2x.png",
        "iphone-20@3x.png",
        "iphone-29@2x.png",
        "iphone-29@3x.png",
        "iphone-40@2x.png",
        "iphone-40@3x.png",
        "iphone-60@2x.png",
        "iphone-60@3x.png",
      ]
    `);
  });
});
