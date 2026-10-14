import { describe, expect, it } from "vitest";
import type { ExportedConfig } from "expo/config-plugins";
import withPlugin from "./index";

describe("Expo config plugin", () => {
  it("registers dangerous mods for Android and iOS", () => {
    const config: ExportedConfig = withPlugin({ name: "test-app", slug: "test-app" }, {});

    expect(config).toMatchInlineSnapshot(`
      {
        "mods": {
          "android": {
            "dangerous": [Function],
          },
          "ios": {
            "dangerous": [Function],
          },
        },
        "name": "test-app",
        "slug": "test-app",
      }
    `);
  });

  it("throws an error on invalid plugin props", () => {
    expect(() =>
      withPlugin(
        { name: "test-app", slug: "test-app" },
        {
          // @ts-expect-error Invalid type for testing purposes
          foregroundPath: 42,
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Failed to configure react-native-svg-app-icon plugin: foregroundPath must be a string (was a number)]`);
  });
});
