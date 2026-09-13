import * as android from "./android";
import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
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

    await expect(generatedFiles).rejects.toThrow("projectRoot must be an absolute path");
  });

  it("returns generated files in an object payload", async () => {
    await expect(
      generate(
        {
          projectRoot: __dirname,
          platforms: [],
          force: false,
          androidOutputPath: "./android/app/src/main/res",
          foregroundPath: path.join(__dirname, "..", "..", "test", "assets", "react-icon.svg"),
        },
        undefined,
      ),
    ).resolves.toEqual({ generatedFiles: [] });
  });

  it("returns absolute generated file paths in the result", async () => {
    const generateSpy = vi.spyOn(android, "generate").mockImplementation(async function* () {
      yield "/tmp/generated-a.png";
      yield "/tmp/generated-b.png";
    });

    try {
      await expect(
        generate(
          {
            projectRoot: __dirname,
            platforms: ["android"],
            force: false,
            androidOutputPath: "./android/app/src/main/res",
            foregroundPath: path.join(__dirname, "..", "..", "test", "assets", "react-icon.svg"),
          },
          undefined,
        ),
      ).resolves.toEqual({
        generatedFiles: ["/tmp/generated-a.png", "/tmp/generated-b.png"],
      });
    } finally {
      generateSpy.mockRestore();
    }
  });
});
