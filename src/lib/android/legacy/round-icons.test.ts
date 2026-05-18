import * as input from "../../util/input";
import * as path from "node:path";
import { beforeAll, beforeEach, describe, it } from "vitest";
import type { ResolvedConfig } from "../config";

import { cleanupTestOutput } from "../../../../test/utils/cleanup";
import { generateLegacyRoundIcons } from "./round-icons";
import { makeContext } from "../../../../test/utils/context";
import { verifyGeneratedFiles } from "../../../../test/utils/file-comparison";

describe("android/legacy/round-icons", () => {
  const baseDir = path.join(__dirname, "round-icons.test.assets");
  const testAssetsPath = path.join(__dirname, "..", "..", "..", "..", "test", "assets");

  let fileInput: input.FileInput;

  beforeAll(async () => {
    await cleanupTestOutput(baseDir);
  });

  beforeEach(async () => {
    fileInput = await input.readIcon(
      {
        projectRoot: baseDir,
        backgroundPath: path.join(testAssetsPath, "square-icon-background.svg"),
        foregroundPath: path.join(testAssetsPath, "square-icon-foreground.svg"),
      },
      undefined,
    );
  });

  it("generates round icons matching reference images", async () => {
    const outputPath = path.join(baseDir, "output");
    const context = makeContext<ResolvedConfig>({
      androidOutputPath: outputPath,
      projectRoot: baseDir,
    });

    for await (const _file of generateLegacyRoundIcons(fileInput, context)) {
      // Files are generated and written to disk
    }

    await verifyGeneratedFiles(baseDir, {
      imageThreshold: 0.03,
    });
  });
});
