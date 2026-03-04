import * as crypto from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import { type } from "arktype";
import * as fse from "fs-extra";
import { memoize } from "../util/memoize";

const cacheDataType = type({
	/** Version of react-native-svg-app-icon that wrote this cache entry. */
	"packageVersion?": "string",
	inputs: { "[string]": "string" },
	outputs: { "[string]": "string" },
});

/**
 * Persisted cache state for a single generation run.
 */
export type CacheData = typeof cacheDataType.infer;

const getCachePath = memoize((): string => {
	const projectHash = crypto
		.createHash("md5")
		.update(process.cwd())
		.digest("hex")
		.substring(0, 8);

	return path.join(
		os.tmpdir(),
		"react-native-svg-app-icon",
		projectHash,
		"cache.json",
	);
});

export async function readCacheData(): Promise<CacheData> {
	try {
		const raw: unknown = await fse.readJson(getCachePath());
		return cacheDataType.assert(raw);
	} catch {
		return { inputs: {}, outputs: {} };
	}
}

export async function writeCacheData(data: CacheData): Promise<void> {
	await fse.outputJson(getCachePath(), data, { spaces: 2 });
}
