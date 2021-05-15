import * as input from "./input";
import * as android from "./android";
import * as ios from "./ios";

export interface Config extends Partial<android.Config>, Partial<ios.Config> {
  icon: Partial<input.Config>;
  exclude?: { android: boolean; ios: boolean };
}

export async function* generate(config: Config): AsyncIterable<string> {
  const iconInput = await input.readIcon(config.icon);

  if (!config.exclude?.android) yield* android.generate(config, iconInput);
  if (!config.exclude?.ios) yield* ios.generate(config, iconInput);
}
