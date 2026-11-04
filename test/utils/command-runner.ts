import { spawn } from "node:child_process";

export interface CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {},
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "pipe" });
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    child.stdout.on("data", (data: Buffer) => stdoutChunks.push(data.toString()));
    child.stderr.on("data", (data: Buffer) => stderrChunks.push(data.toString()));
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
        exitCode,
      });
    });
  });
}
