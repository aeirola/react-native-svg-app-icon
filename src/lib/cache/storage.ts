import * as crypto from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import { type } from "arktype";
import * as fse from "fs-extra";
import type { Logger } from "../util/logger";

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

/**
 * Handles reading and writing of persisted cache state for a project.
 *
 * The cache file location is derived from a hash of the project identifier,
 * so each project gets its own isolated cache file under the system temp
 * directory.
 */
export class CacheStorage {
	private readonly cachePath: string;
	private readonly logger: Logger | undefined;

	/**
	 * @param projectId - A string uniquely identifying the project (typically
	 *   the project root path). Used to derive a stable cache file location.
	 * @param logger - Optional logger for diagnostic messages on cache misses
	 *   or read failures.
	 */
	constructor(projectId: string, logger: Logger | undefined) {
		this.logger = logger;
		const projectHash = crypto
			.createHash("md5")
			.update(projectId)
			.digest("hex")
			.substring(0, 8);

		this.cachePath = path.join(
			os.tmpdir(),
			"react-native-svg-app-icon",
			projectHash,
			"cache.json",
		);
	}

	/**
	 * Reads persisted cache data from disk. Returns an empty cache if the file
	 * does not exist or cannot be parsed.
	 */
	async read(): Promise<CacheData> {
		try {
			const raw: unknown = await fse.readJson(this.cachePath);
			return cacheDataType.assert(raw);
		} catch (error) {
			this.logger?.debug(
				`Could not read cache at ${this.cachePath}: ${error instanceof Error ? error.message : error}`,
			);
			return { inputs: {}, outputs: {} };
		}
	}

	/**
	 * Persists cache data to disk, creating parent directories as needed.
	 */
	async write(data: CacheData): Promise<void> {
		await fse.outputJson(this.cachePath, data, { spaces: 2 });
	}
}
