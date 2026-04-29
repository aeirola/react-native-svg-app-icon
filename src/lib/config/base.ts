/**
 * Base configuration shared by all sub-module configs.
 * Contains fields that are always required and apply across all platforms.
 */
export interface BaseConfig {
	/** Absolute path to the project root directory. All relative paths resolve against it. */
	projectRoot: string;
}
