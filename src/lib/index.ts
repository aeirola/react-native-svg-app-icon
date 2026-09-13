import * as android from "./android";
import * as input from "./util/input";
import * as ios from "./ios";
import { Config, type Platform, type ResolvedConfig } from "./config";
import { CacheSession } from "./cache";
import type { Context } from "./util/context";
import type { Logger } from "./util/logger";

export { Config } from "./config";
export type { Platform };

export interface GenerateResult {
  /**
   * Absolute paths of files written during this generate call.
   *
   * Files skipped as up to date by the cache are omitted, so this only
   * includes files that were actually generated or overwritten. Paths are
   * returned after output path resolution, even when the configured output
   * paths were relative.
   */
  generatedFiles: string[];
}

/**
 * Generate platform-specific app icons from SVG source files.
 *
 * @param config - Icon paths, target platforms, and output settings.
 * @param logger - Optional logger for progress and diagnostic messages.
 *   When `undefined`, all logging is disabled.
 * @returns A promise resolving to an object containing the generated file paths
 *   in `generatedFiles`.
 */
export async function generate(
  config: Config,
  logger: Logger | undefined,
): Promise<GenerateResult> {
  const resolvedConfig = Config.assert(config);
  const generatedFiles: string[] = [];

  const iconInput = await input.readIcon(resolvedConfig, logger);

  const cache = new CacheSession({
    inputFileBuffers: iconInput.fileBuffers,
    config: resolvedConfig,
    logger,
  });

  const context: Context<ResolvedConfig> = {
    config: resolvedConfig,
    logger,
    cache,
  };

  try {
    if (resolvedConfig.platforms.includes("android")) {
      logger?.info("Generating Android icons");
      for await (const file of android.generate(context, iconInput)) {
        generatedFiles.push(file);
        logger?.info(`Wrote ${file}`);
      }
    }
    if (resolvedConfig.platforms.includes("ios")) {
      logger?.info("Generating iOS icons");
      for await (const file of ios.generate(context, iconInput)) {
        generatedFiles.push(file);
        logger?.info(`Wrote ${file}`);
      }
    }
    return { generatedFiles };
  } finally {
    await cache.flush();
  }
}
