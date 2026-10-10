import { runCommand } from "./command-runner";

// Run via node, since spawning npx without a shell fails on Windows (ENOENT)
const expoCliPath = require.resolve("expo/bin/cli");

export function runExpo(args: string[]): ReturnType<typeof runCommand> {
  return runCommand(process.execPath, [expoCliPath, ...args], {
    env: {
      ...process.env,
      EXPO_OFFLINE: "1",
      EXPO_NO_TELEMETRY: "1",
    },
  });
}
