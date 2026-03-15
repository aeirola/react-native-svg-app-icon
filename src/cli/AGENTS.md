# CLI Layer

The CLI is the main user-facing entry point, exposed via the `bin` field in `package.json` (maps to `lib/cli/index.js`).

## Files

- [config.ts](config.ts) - Configuration resolution: merges defaults → `app.json` → CLI arguments
- [index.ts](index.ts) - CLI entry point: validates inputs, creates logger, calls core `generate()`

## Configuration Resolution

[config.ts](config.ts) uses an **ArkType schema with embedded CLI metadata**. Each config property has a `.configure({ cli: [...] })` call that provides Commander.js option arguments. This allows automatic CLI option generation from the same schema that validates `app.json` input.

Resolution order (later overrides earlier):
1. ArkType schema defaults
2. `app.json` → `svgAppIcon` key (validated with ArkType)
3. Commander.js parsed CLI arguments

The `app.json` file is optional — missing file (ENOENT) is silently ignored. The `svgAppIcon` key within `app.json` is also optional.

## Config Properties

`backgroundPath`, `foregroundPath`, `platforms`, `force`, `androidOutputPath`, `iosOutputPath`, `logLevel`, `appName`

## CLI Entry Point

[index.ts](index.ts) handles:
- Foreground icon existence check (throws if missing)
- Platform name normalization (lowercase) and validation
- Background path existence check (passes `undefined` if missing, triggering default background)
- Progress logging for each generated file
- Error handling with `process.exit(1)`
