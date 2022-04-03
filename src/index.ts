import * as input from "./input";
import * as android from "./android";
import * as ios from "./ios";

/**
 * Supported platforms for generating icons.
 */
export type Platform = "android" | "ios";

export interface Config extends Partial<android.Config>, Partial<ios.Config> {
  icon: Partial<input.Config>;
  platforms: Platform[];
}

export async function* generate(config: Config): AsyncIterable<string> {
  const iconInput = await input.readIcon(config.icon);

  if (config.platforms.includes("android")) {
    yield* android.generate(config, iconInput);
  }
  if (config.platforms.includes("ios")) {
    yield* ios.generate(config, iconInput);
  }
}
