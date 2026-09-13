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
  files: string[];
}

/**
 * Generate platform-specific app icons from SVG source files.
 *
 * @param config - Icon paths, target platforms, and output settings.
 * @param logger - Optional logger for progress and diagnostic messages.
 *   When `undefined`, all logging is disabled.
 * @returns A promise resolving to an object containing the generated file paths
 *   in `files`.
 */
export async function generate(
  config: Config,
  logger: Logger | undefined,
): Promise<GenerateResult> {
  const resolvedConfig = Config.assert(config);
  const files: string[] = [];

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
      await collectGeneratedFiles(android.generate(context, iconInput), files, logger);
    }
    if (resolvedConfig.platforms.includes("ios")) {
      logger?.info("Generating iOS icons");
      await collectGeneratedFiles(ios.generate(context, iconInput), files, logger);
    }
    return { files };
  } finally {
    await cache.flush();
  }
}

async function collectGeneratedFiles(
  generatedFiles: AsyncIterable<string>,
  files: string[],
  logger: Logger | undefined,
): Promise<void> {
  for await (const file of generatedFiles) {
    files.push(file);
    logger?.info(`Wrote ${file}`);
  }
}
