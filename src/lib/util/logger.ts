/**
 * Logger type contract with methods for each log level.
 *
 * Implementations decide how (and whether) to handle each level.
 */
export type Logger = {
	/** An unrecoverable situation that prevents the operation from completing. */
	error(message: string): void;
	/** A potential issue that does not prevent completion but may need attention. */
	warn(message: string): void;
	/** High-level progress updates for normal operation (e.g. files written). */
	info(message: string): void;
	/** Detailed diagnostic information useful during development or troubleshooting. */
	debug(message: string): void;
};
