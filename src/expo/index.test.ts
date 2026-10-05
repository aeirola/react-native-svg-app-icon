import { describe, expect, it } from "vitest";
import { ExportedConfig } from "expo/config-plugins";
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
});
