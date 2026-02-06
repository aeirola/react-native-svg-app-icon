import { spawn } from "node:child_process";
import * as path from "node:path";

/**
 * Runs the CLI as a separate Node process
 */
export async function runCli(
	args: string[],
	options?: { cwd?: string },
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
	const cliPath = path.resolve(__dirname, "../../lib/cli/index.js");

	return new Promise((resolve, reject) => {
		const child = spawn("node", [cliPath, ...args], {
			stdio: "pipe",
			cwd: options?.cwd,
		});

		const stdoutChunks: string[] = [];
		const stderrChunks: string[] = [];

		child.stdout?.on("data", (data) => {
			stdoutChunks.push(data.toString());
		});

		child.stderr?.on("data", (data) => {
			stderrChunks.push(data.toString());
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("close", (exitCode) => {
			resolve({
				stdout: stdoutChunks.join(""),
				stderr: stderrChunks.join(""),
				exitCode,
			});
		});
	});
}
