import { runCommand } from "./command-runner";

export function runExpo(args: string[]): ReturnType<typeof runCommand> {
  return runCommand("npx", ["expo", ...args], {
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: "1",
    },
  });
}
