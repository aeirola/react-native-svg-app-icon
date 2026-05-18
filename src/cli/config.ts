import { type } from "arktype";
import * as commander from "commander";
import * as fse from "fs-extra";
import { Config as LibConfig } from "../lib/config";

/**
 * Schema for configuration properties.
 */
const CliConfig = LibConfig.omit(
	"appName",
	"projectRoot",
	"backgroundPath",
	"foregroundPath",
).and({
	backgroundPath: LibConfig.required()
		.get("backgroundPath")
		.default("./icon-background.svg"),
	foregroundPath: LibConfig.get("foregroundPath").default("./icon.svg"),
	logLevel: type("'silent'|'error'|'warn'|'info'|'debug'").default("info"),
});

type CliConfig = typeof CliConfig.infer;

type CommanderArgs = ConstructorParameters<typeof commander.Option>;

/**
 * CLI option metadata for each property, enabling Commander.js option
 * generation for the same values.
 */
const configFlags: {
	[Field in keyof Required<CliConfig>]: CommanderArgs;
} = {
	backgroundPath: ["--background-path <path>", "background icon path"],
	foregroundPath: ["--foreground-path <path>", "foreground icon path"],
	platforms: [
		"--platforms <platforms...>",
		"platforms for which to generate icons",
	],
	force: ["-f, --force", "overwrite existing newer files"],
	androidOutputPath: ["--android-output-path <path>", "android output path"],
	iosOutputPath: ["--ios-output-path <path>", "ios output path"],
	logLevel: ["--log-level <level>", "log level"],
};

const { backgroundPath: defaultBackgroundPath, ...defaultConfig } =
	CliConfig.assert({});

/**
 * Fully resolved configuration, merged from defaults, app.json, and CLI arguments.
 */
export type ResolvedConfig = Omit<CliConfig, "backgroundPath"> & {
	backgroundPath?: CliConfig["backgroundPath"];
	appName?: typeof AppJson.infer.name;
};

/**
 * Resolve and merge configuration from all sources:
 * defaults → app.json → command-line arguments
 *
 * Also resolves the background icon path: an explicitly provided path is
 * used as-is, otherwise the default path is used when it is present on disk.
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
const AppJson = type({
	"name?": "string",
	"displayName?": "string",
	svgAppIcon: CliConfig.default(() => ({})),
});

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}

async function readAppJsonConfig(): Promise<Partial<ResolvedConfig>> {
	let rawAppJson: unknown;
	try {
		rawAppJson = await fse.readJson("./app.json");
	} catch (error) {
		// Only fall back to default if file not found
		if (isErrnoException(error) && error.code === "ENOENT") {
			rawAppJson = {};
		} else {
			throw error;
		}
	}

	// Validate the app.json structure, but omit defaults
	if (AppJson.allows(rawAppJson)) {
		return {
			...(rawAppJson.name ? { appName: rawAppJson.name } : {}),
			...rawAppJson.svgAppIcon,
		};
	} else {
		const result = AppJson(rawAppJson);
		throw new Error(
			`Invalid app.json: ${result instanceof type.errors ? result.summary : "Unknown validation error"}`,
		);
	}
}

function readCliArgs(args: string[]): Partial<ResolvedConfig> {
	const program = new commander.Command();

	program.name("react-native-svg-app-icon");

	for (const opt of CliConfig.props) {
		const optMeta = opt.value.meta;
		const cliOption = new commander.Option(...configFlags[opt.key]);

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
