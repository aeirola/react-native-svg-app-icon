import { describe, expect, it } from "vitest";
import type { ExportedConfig } from "expo/config-plugins";
import withPlugin from "./index";

describe("Expo config plugin", () => {
  it("registers mods for Android and iOS", () => {
    const config: ExportedConfig = withPlugin(
      {
        name: "Expo unit test app",
        slug: "expo-unit-test-app",
        _internal: {
          // Required by withPlugin, though not used
          projectRoot: __dirname,
        },
      },
      {},
    );

    expect(config).toMatchInlineSnapshot(
      { _internal: expect.any(Object) },
      `
      {
        "_internal": Any<Object>,
        "mods": {
          "android": {
            "dangerous": [Function],
            "manifest": [Function],
          },
          "ios": {
            "dangerous": [Function],
            "xcodeproj": [Function],
          },
        },
        "name": "Expo unit test app",
        "slug": "expo-unit-test-app",
      }
    `,
    );
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
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Failed to configure react-native-svg-app-icon plugin: foregroundPath must be a string (was a number)]`,
    );
  });
});
