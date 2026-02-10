import { type } from "arktype";
import * as commander from "commander";
import * as fse from "fs-extra";

// Enable defining commandline options directly in ArkType schema metadata
declare global {
	interface ArkEnv {
		meta(): {
			cli?: ConstructorParameters<typeof commander.Option>;
		};
	}
}

/**
 * Schema for configuration properties.
 *
 * CLI option metadata is embedded via ArkType `.configure()` for each property,
 * enabling automatic Commander.js option generation from the same schema.
 */
const configSchema = type({
	backgroundPath: type("string")
		.configure({
			cli: ["--background-path <path>", "background icon path"],
		})
		.default("./icon-background.svg"),
	foregroundPath: type("string")
		.configure({
			cli: ["--foreground-path <path>", "foreground icon path"],
		})
		.default("./icon.svg"),
	platforms: type("('android'|'ios')[]")
		.configure({
			cli: [
				"--platforms <platforms...>",
				"platforms for which to generate icons",
			],
		})
		.default(() => ["android", "ios"]),
	force: type("boolean")
		.configure({
			cli: ["-f, --force", "overwrite existing newer files"],
		})
		.default(false),
	androidOutputPath: type("string")
		.configure({
			cli: ["--android-output-path <path>", "android output path"],
		})
		.default("./android/app/src/main/res"),
	"iosOutputPath?": type("string").configure({
		cli: ["--ios-output-path <path>", "ios output path"],
	}),
	logLevel: type("'silent'|'error'|'warn'|'info'|'debug'")
		.configure({
			cli: ["--log-level <level>", "log level"],
		})
		.default("info"),
});

/**
 * Fully resolved configuration, merged from defaults, app.json, and CLI arguments.
 */
export type ResolvedConfig = typeof configSchema.infer & {
	appName?: typeof appJsonSchema.infer.name;
};

/**
 * Read and merge configuration from all sources:
 * defaults → app.json → command-line arguments
 */
export async function readConfig(args: string[] = []): Promise<ResolvedConfig> {
	return {
		...(await readAppJsonConfig()),
		...readCliArgs(args),
	};
}

/**
 * ArkType schema for app.json structure
 */
const appJsonSchema = type({
	"name?": "string",
	"displayName?": "string",
	svgAppIcon: configSchema.default(() => ({})),
});

async function readAppJsonConfig(): Promise<ResolvedConfig> {
	let rawAppJson: unknown;
	try {
		rawAppJson = await fse.readJson("./app.json");
	} catch (error) {
		// Only fall back to default if file not found
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			rawAppJson = {};
		} else {
			throw error;
		}
	}

	// Validate the app.json structure
	const result = appJsonSchema(rawAppJson);

	if (result instanceof type.errors) {
		throw new Error(`Invalid app.json: ${result.summary}`);
	}

	return {
		...(result.name ? { appName: result.name } : {}),
		...result.svgAppIcon,
	};
}

function readCliArgs(args: string[]): Partial<ResolvedConfig> {
	const program = new commander.Command();

	program.name("react-native-svg-app-icon");

	for (const opt of configSchema.props) {
		const optMeta = opt.value.meta;
		if (!optMeta?.cli) continue; // Skip properties without CLI flag configuration

		const cliOption = new commander.Option(...optMeta.cli);

		if (optMeta.default !== undefined) {
			cliOption.default(optMeta.default);
		}

		// Not the most straightforward way to extract argument choices
		// but works for our use cases
		const stringChoices = opt.value
			.select("unit")
			.map(({ unit }) => unit)
			.filter((unit) => typeof unit === "string");
		if (stringChoices.length) {
			cliOption.choices(stringChoices);
		}

		program.addOption(cliOption);
	}

	program.parse(args);

	// Strip default values so that they don't override config file values
	const userDefinedOptions = Object.fromEntries(
		Object.entries(program.opts()).filter(
			([key]) => program.getOptionValueSource(key) !== "default",
		),
	);

	return userDefinedOptions;
}
