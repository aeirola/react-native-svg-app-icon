import * as input from "./input";
import * as android from "./android";
import * as ios from "./ios";

export interface Config extends Partial<android.Config>, Partial<ios.Config> {
  icon: string;
}

export async function* generate(config: Config): AsyncIterable<string> {
  const fileInput = await input.readFile(config.icon);

  yield* android.generate(config, fileInput);
  yield* ios.generate(config, fileInput);
}
