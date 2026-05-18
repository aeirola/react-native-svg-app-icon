import * as path from "node:path";
import { describe, expect, it } from "vitest";

import { generate } from "./index";

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

    await expect(generatedFiles[Symbol.asyncIterator]().next()).rejects.toThrow(
      "projectRoot must be an absolute path",
    );
  });
});
