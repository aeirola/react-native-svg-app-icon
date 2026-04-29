import * as crypto from "node:crypto";
import * as fse from "fs-extra";
import type { BaseConfig } from "../config/base";
import type { InputFileBuffers } from "../util/input";
import type { Logger } from "../util/logger";
import { getPackageVersion } from "../util/version";
import { type CacheData, CacheStorage } from "./storage";

export type PartialConfig = BaseConfig & {
	/** Write output files even if they are up-to-date. */
	force?: boolean;
};

function hashBuffer(buffer: Buffer): string {
	return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function hashFile(filePath: string): Promise<string | null> {
	try {
		const data = await fse.readFile(filePath);
		return hashBuffer(data);
	} catch {
		return null;
	}
}

/**
 * Tracks input and output file hashes for a single generation run.
 * Owns the input file paths and force flag so that output functions
 * don't need to handle either directly.
 *
 * Usage:
 *   const session = new CacheSession({ inputFileBuffers: { background: bgBuffer, foreground: fgBuffer }, force });
 *   // For each output file:
 *   if (await session.isUpToDate(outputPath)) continue;
 *   // ... generate content buffer ...
 *   session.recordBuffer(outputPath, buffer);
 *   // At end of run:
 *   await session.flush();
 */
export class CacheSession {
	private readonly inputFileBuffers: InputFileBuffers;
	private readonly force: boolean;
	private readonly logger: Logger | undefined;
	private readonly storage: CacheStorage;

	/** In-memory record of output hashes written this run. */
	private newOutputHashes: Record<string, string> = {};

	constructor({
		inputFileBuffers,
		config,
		logger,
	}: {
		inputFileBuffers: InputFileBuffers;
		config: PartialConfig;
		logger: Logger | undefined;
	}) {
		this.inputFileBuffers = inputFileBuffers;
		this.force = config.force ?? false;
		this.logger = logger;
		this.storage = new CacheStorage(config.projectRoot, logger);
	}

	/**
	 * Returns true if the output file is up-to-date and does not need to
	 * be regenerated. Always returns false when force is true.
	 */
	async isUpToDate(outputFilePath: string): Promise<boolean> {
		if (this.force) {
			this.logger?.debug(`Cache miss for ${outputFilePath}: force flag is set`);
			return false;
		}

		if (await this.hasPackageVersionChanged()) {
			this.logger?.debug(
				`Cache miss for ${outputFilePath}: package version changed`,
			);
			return false;
		}

		if (await this.haveInputsChanged()) {
			this.logger?.debug(
				`Cache miss for ${outputFilePath}: input files changed`,
			);
			return false;
		}

		const cache = await this.loadCache();
		const cachedOutputHash = cache.outputs[outputFilePath];
		if (!cachedOutputHash) {
			this.logger?.debug(
				`Cache miss for ${outputFilePath}: no cached hash found`,
			);
			return false;
		}

		const currentOutputHash = await hashFile(outputFilePath);
		if (currentOutputHash === cachedOutputHash) {
			this.newOutputHashes[outputFilePath] = cachedOutputHash;
			return true;
		}
		this.logger?.debug(
			`Cache miss for ${outputFilePath}: output file changed on disk`,
		);
		return false;
	}

	/**
	 * Records the hash of content that was computed in memory and written to
	 * an output file. Use this when the content buffer is already available to
	 * avoid a redundant disk read.
	 */
	recordBuffer(outputFilePath: string, content: Buffer): void {
		this.newOutputHashes[outputFilePath] = hashBuffer(content);
	}

	/**
	 * Writes the updated cache (current input hashes + all recorded output
	 * hashes) to disk. Call once at the end of the generation run.
	 */
	async flush(): Promise<void> {
		const inputHashes = this.computeInputHashes();
		const packageVersion = await getPackageVersion();
		await this.storage.write({
			packageVersion,
			inputs: inputHashes,
			outputs: this.newOutputHashes,
		});
	}

	/** Whether the package version changed vs. the stored cache. */
	private packageVersionChangedPromise?: Promise<boolean>;
	private hasPackageVersionChanged(): Promise<boolean> {
		this.packageVersionChangedPromise ??= Promise.all([
			this.loadCache(),
			getPackageVersion(),
		]).then(
			([cache, currentVersion]) => currentVersion !== cache.packageVersion,
		);
		return this.packageVersionChangedPromise;
	}

	/** Whether any input file hash changed vs. the stored cache. */
	private inputsChangedPromise?: Promise<boolean>;
	private haveInputsChanged(): Promise<boolean> {
		this.inputsChangedPromise ??= this.loadCache().then((cache) => {
			const currentHashes = this.computeInputHashes();
			return Object.keys(this.inputFileBuffers).some(
				(role) => currentHashes[role] !== cache.inputs[role],
			);
		});
		return this.inputsChangedPromise;
	}

	/** Lazily computed per-file hashes for all input files. */
	private cachedInputHashes?: Record<string, string>;
	private computeInputHashes(): Record<string, string> {
		this.cachedInputHashes ??= Object.fromEntries(
			Object.entries(this.inputFileBuffers).map(([role, buffer]) => [
				role,
				hashBuffer(buffer),
			]),
		);
		return this.cachedInputHashes;
	}

	/** Lazily loaded from disk, then kept in memory. */
	private cacheDataPromise?: Promise<CacheData>;
	private loadCache(): Promise<CacheData> {
		this.cacheDataPromise ??= this.storage.read();
		return this.cacheDataPromise;
	}
}
