import * as path from "node:path";
import { runCommand } from "./command-runner";

/**
 * Runs the CLI as a separate Node process
 */
export function runCli(args: string[], options?: { cwd?: string }): ReturnType<typeof runCommand> {
  const cliPath = path.resolve(__dirname, "../../dist/cli/index.js");
  return runCommand("node", [cliPath, ...args], options);
}
