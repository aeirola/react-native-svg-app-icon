/**
 * Simple logger with configurable log levels.
 * Supports: silent, error, warn, info, debug
 * Default: info
 */

enum LogLevelValues {
	silent = 0,
	error = 1,
	warn = 2,
	info = 3,
	debug = 4,
}

export type LogLevel = keyof typeof LogLevelValues;

export type Logger = {
	[level in LogLevel]: (...args: unknown[]) => void;
};

/**
 * Create a logger instance with the specified log level
 */
export function createLogger(level: LogLevel = "info"): Logger {
	const currentLevel = LogLevelValues[level];

	function shouldLog(messageLevel: LogLevel): boolean {
		return LogLevelValues[messageLevel] <= currentLevel;
	}

	return {
		error(...args: unknown[]): void {
			if (shouldLog("error")) {
				console.error(...args);
			}
		},

		warn(...args: unknown[]): void {
			if (shouldLog("warn")) {
				console.warn(...args);
			}
		},

		info(...args: unknown[]): void {
			if (shouldLog("info")) {
				console.log(...args);
			}
		},

		debug(...args: unknown[]): void {
			if (shouldLog("debug")) {
				console.debug(...args);
			}
		},

		silent(..._args: unknown[]): void {
			// do nothing
		},
	};
}
