import { describe, expect, it } from "vitest";
import { version as packageVersion } from "../../package.json";
import { getPackageVersion } from "./version";

describe("getPackageVersion", () => {
	/** @see https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string */
	const semverRegex =
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

	it("returns a semver-formatted string matching the actual package.json", async () => {
		const version = await getPackageVersion();

		expect(version).toMatch(semverRegex);
		expect(version).toBe(packageVersion);
	});
});
