import { describe, expect, it } from "vitest";
import { getPackageVersion } from "./version";

describe("getPackageVersion", () => {
	it("returns a semver-formatted string matching the actual package.json", async () => {
		const version = await getPackageVersion();

		expect(version).toMatch(/^\d+\.\d+\.\d+$/);
	});
});
