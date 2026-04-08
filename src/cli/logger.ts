import type { Logger } from "../lib/util/logger";

enum LogLevelValues {
	error = 1,
	warn = 2,
	info = 3,
	debug = 4,
}

type LogLevel = "silent" | keyof typeof LogLevelValues;

/**
 * Create a logger instance with the specified log level
 */
export function createLogger(level: LogLevel = "info"): Logger | undefined {
	if (level === "silent") {
		return undefined;
	}

	const currentLevel = LogLevelValues[level];

	function shouldLog(messageLevel: keyof typeof LogLevelValues): boolean {
		return LogLevelValues[messageLevel] <= currentLevel;
	}

	return {
		error(message: string): void {
			if (shouldLog("error")) {
				console.error(message);
			}
		},

		warn(message: string): void {
			if (shouldLog("warn")) {
				console.warn(message);
			}
		},

		info(message: string): void {
			if (shouldLog("info")) {
				console.log(message);
			}
		},

		debug(message: string): void {
			if (shouldLog("debug")) {
				console.debug(message);
			}
		},
	};
}
