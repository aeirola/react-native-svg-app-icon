import * as android from "./android";
import * as input from "./util/input";
import * as ios from "./ios";
import { Config, type Platform, type ResolvedConfig } from "./config";
import { type Task, runTasks } from "./tasks";
import { CacheSession } from "./cache";
import type { Context } from "./util/context";
import type { Logger } from "./util/logger";

export { Config } from "./config";
export type { Platform };

/**
 * Generate platform-specific app icons from SVG source files.
 *
 * @param config - Icon paths, target platforms, and output settings.
 * @param logger - Optional logger for progress and diagnostic messages.
 *   When `undefined`, all logging is disabled.
 * @returns Generated file paths in platform generator yield order.
 */
export async function generate(config: Config, logger: Logger | undefined): Promise<string[]> {
  const resolvedConfig = Config.assert(config);

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
    return await runTasks(generateTasks(context, iconInput), {
      concurrency: resolvedConfig.concurrency,
      logger,
    });
  } finally {
    await cache.flush();
  }
}

async function* generateTasks(
  context: Context<ResolvedConfig>,
  iconInput: input.FileInput,
): AsyncIterable<Task> {
  if (context.config.platforms.includes("android")) {
    context.logger?.info("Generating Android icons");
    yield* android.generate(context, iconInput);
  }
  if (context.config.platforms.includes("ios")) {
    context.logger?.info("Generating iOS icons");
    yield* ios.generate(context, iconInput);
  }
}
