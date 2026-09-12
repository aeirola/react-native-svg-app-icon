import * as path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "./tasks";

const androidTasks: Task[] = [];
const iosTasks: Task[] = [];

vi.mock("./android", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./android")>();
  return {
    ...actual,
    generate: async function* (): AsyncIterable<Task> {
      yield* androidTasks;
    },
  };
});

vi.mock("./ios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ios")>();
  return {
    ...actual,
    generate: async function* (): AsyncIterable<Task> {
      yield* iosTasks;
    },
  };
});

vi.mock("./util/input", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./util/input")>();
  return {
    ...actual,
    readIcon: vi.fn(async () => ({ fileBuffers: { foreground: Buffer.from("icon") } })),
  };
});

vi.mock("./cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./cache")>();
  return {
    ...actual,
    CacheSession: class {
      async flush(): Promise<void> {}
    },
  };
});

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

  it("interleaves platform task generators in round-robin order", async () => {
    androidTasks.length = 0;
    iosTasks.length = 0;
    androidTasks.push({ run: async () => "android-1" }, { run: async () => "android-2" });
    iosTasks.push({ run: async () => "ios-1" }, { run: async () => "ios-2" });

    await expect(
      generate(
        {
          projectRoot: "/project",
          platforms: ["android", "ios"],
          force: false,
          androidOutputPath: "./android/app/src/main/res",
          foregroundPath: path.join(__dirname, "..", "..", "test", "assets", "react-icon.svg"),
        },
        undefined,
      ),
    ).resolves.toEqual(["android-1", "ios-1", "android-2", "ios-2"]);
  });

  it("skips completed generators while continuing the remaining platform", async () => {
    androidTasks.length = 0;
    iosTasks.length = 0;
    androidTasks.push({ run: async () => "android-1" });
    iosTasks.push({ run: async () => "ios-1" }, { run: async () => "ios-2" });

    await expect(
      generate(
        {
          projectRoot: "/project",
          platforms: ["android", "ios"],
          force: false,
          androidOutputPath: "./android/app/src/main/res",
          foregroundPath: path.join(__dirname, "..", "..", "test", "assets", "react-icon.svg"),
        },
        undefined,
      ),
    ).resolves.toEqual(["android-1", "ios-1", "ios-2"]);
  });
});
