import * as path from "node:path";
import { type } from "arktype";
import * as fse from "fs-extra";

const packageJsonPath = path.join(__dirname, "..", "..", "..", "package.json");

const packageJsonSchema = type({ version: "string" });

/**
 * Reads the version field from the package's `package.json` file.
 *
 * @returns The semver version string (e.g. `"1.2.3"`).
 * @throws If `package.json` cannot be read or does not contain a string `version` field.
 */
export async function getPackageVersion(): Promise<string> {
	const raw = await fse.readJson(packageJsonPath);
	const pkg = packageJsonSchema.assert(raw);
	return pkg.version;
}
