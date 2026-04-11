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

type ConfigSchema = typeof configSchema.infer;

const { backgroundPath: defaultBackgroundPath, ...defaultConfig } =
	configSchema.assert({});

/**
 * Fully resolved configuration, merged from defaults, app.json, and CLI arguments.
 */
export type ResolvedConfig = Omit<ConfigSchema, "backgroundPath"> & {
	backgroundPath?: ConfigSchema["backgroundPath"];
	appName?: typeof appJsonSchema.infer.name;
};

/**
 * Resolve and merge configuration from all sources:
 * defaults → app.json → command-line arguments
 *
 * Also resolves the background icon path: if explicitly provided it must
 * exist, otherwise falls back to the default path if present on disk.
 */
export async function resolveConfig(
	args: string[] = [],
): Promise<ResolvedConfig> {
	const fileConfig = await readAppJsonConfig();
	const cliConfig = readCliArgs(args);

	const userConfig = {
		...fileConfig,
		...cliConfig,
	};

	const backgroundPath = await resolveBackgroundPath(userConfig.backgroundPath);

	return {
		...defaultConfig,
		...userConfig,
		...(backgroundPath ? { backgroundPath } : {}),
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

async function readAppJsonConfig(): Promise<Partial<ResolvedConfig>> {
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

	// Validate the app.json structure, but omit defaults
	if (appJsonSchema.allows(rawAppJson)) {
		return {
			...(rawAppJson.name ? { appName: rawAppJson.name } : {}),
			...rawAppJson.svgAppIcon,
		};
	} else {
		const result = appJsonSchema(rawAppJson);
		throw new Error(
			`Invalid app.json: ${result instanceof type.errors ? result.summary : "Unknown validation error"}`,
		);
	}
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

async function resolveBackgroundPath(
	backgroundPath: string | undefined,
): Promise<string | undefined> {
	if (backgroundPath) {
		return backgroundPath;
	}

	// No explicit path — use default if it exists on disk
	if (await fse.pathExists(defaultBackgroundPath)) {
		return defaultBackgroundPath;
	}

	// No background icon available — fall back to internal white background
	return undefined;
}
