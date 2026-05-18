import * as path from "node:path";
import { type } from "arktype";

const AbsolutePath = type("string").narrow((value, ctx) => {
  if (!path.isAbsolute(value)) {
    return ctx.mustBe("an absolute path");
  }
  return true;
});

/**
 * Base configuration shared by all sub-module configs.
 * Contains fields that are always required and apply across all platforms.
 */
export const BaseConfig = type({
  /** Absolute path to the project root directory. All relative paths resolve against it. */
  projectRoot: AbsolutePath,
});

export type BaseConfig = typeof BaseConfig.infer;
