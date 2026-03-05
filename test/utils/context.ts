import { CacheSession } from "../../src/cache";
import type { Context } from "../../src/util/context";
import { createLogger } from "../../src/util/logger";

export const logger = createLogger("silent");

export const cache = new CacheSession({
	inputFileBuffers: {
		foreground: Buffer.from(""),
		background: Buffer.from(""),
	},
	force: true,
});

/**
 * Creates a test context with sensible defaults.
 *
 * @param config - The configuration object for the context.
 * @returns A {@link Context} with a silent logger and a forced cache session
 *   (always regenerates output, regardless of input file content).
 *
 * @example
 * ```ts
 * import { makeContext } from "../../test/utils/context";
 *
 * const context = makeContext({ androidOutputPath: outputPath });
 * ```
 */
export function makeContext<C>(config: C): Context<C> {
	return { config, logger, cache };
}
