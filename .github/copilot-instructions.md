# Copilot Instructions for react-native-svg-app-icon

## Project Overview

CLI tool that generates iOS and Android app launcher icons from SVG source files for React Native projects. Converts a single 108x108 SVG into platform-specific assets: iOS PNGs, Android adaptive icons (vector drawable with PNG fallback), and legacy square/round icons.

## Architecture

### Source Code Structure (`src/`)

- [index.ts](../src/index.ts) - Main entry point, orchestrates platform generators via async iterables
- [cli.ts](../src/cli.ts) - CLI layer: merges config from `app.json` → CLI args → defaults
- [input.ts](../src/input.ts) - SVG file reading, validation, lazy-loading with Sharp
- [output.ts](../src/output.ts) - PNG generation with Sharp, handles caching based on file modification times
- [ios.ts](../src/ios.ts) - iOS icon generation (PNGs + Contents.json manifest)
- [android.ts](../src/android.ts) - Android icon generation (vector drawables, adaptive icons, legacy icons)
- [optional.ts](../src/optional.ts) - Utility type for optional properties

### Key Design Patterns

**Async Iterables for Output**: All generators use `async function*` to yield file paths as they're written:
```typescript
export async function* generate(config: Config): AsyncIterable<string> {
  yield* android.generate(config, iconInput);
  yield* ios.generate(config, iconInput);
}
```

**Lazy Loading**: Sharp library is loaded only when needed (expensive import). Type-only imports at top, dynamic import in `input.ts`.

**Incremental Builds**: Output files are skipped if newer than input files (unless `force: true`).

## Development Workflow

```bash
npm install           # Install dependencies
npm run prepare       # Build TypeScript → lib/ (runs automatically on install)
npm test              # Run all checks in parallel (lint, types, unit tests)
npm run test:unit     # Run vitest tests only
```

### Testing

- Tests use Vitest with fixture-based comparison in [test_fixtures/](../test_fixtures/)
- Tests create temp directories, `process.chdir()` into them, then compare generated output against fixtures
- PNG comparison uses `pixelmatch` with configurable thresholds (0.1-0.16)
- Add new fixtures by creating a directory with `icon.svg`, `app.json`, and expected output structure

### Build Artifacts

- Source: `src/*.ts` → Compiled: `lib/*.js` (CommonJS)
- Published files: `lib/` and `assets/`
- Two tsconfig files: `tsconfig.json` (type checking, noEmit) and `tsconfig.build.json` (actual build)

## Code Style

- **Biome** for linting/formatting (not ESLint/Prettier)
- Run `npx biome check` or use IDE integration
- Example directories (`example-rn/`, `example-expo/`) are excluded from linting

## Key Dependencies

- **sharp**: SVG → PNG rasterization (handles density/DPI scaling). Use context7 library documentation `/lovell/sharp` for API and docs.
- **svg2vectordrawable**: SVG → Android vector drawable XML conversion
- **commander**: CLI argument parsing
- **fs-extra**: Enhanced file system operations

Always use Context7 MCP when library/API documentation, code generation, setup, or configuration steps are needed, without requiring an explicit request.

## Android Icon Specifics

Android generation in [android.ts](../src/android.ts) handles multiple icon types:
- Adaptive icons (SDK 26+): Vector drawable foreground/background with PNG fallback for complex SVGs
- Legacy square icons: 48dp base with rounded corners, drop shadow
- Legacy round icons: 44dp diameter circular mask

Vector drawable conversion may fail for complex SVG features (text, filters). The code catches these and falls back to PNG.

For legacy icons refer to https://m2.material.io/design/platform-guidance/android-icons.html for specification.

For adaptive icons, refer to https://developer.android.com/develop/ui/views/launch/icon_design_adaptive and https://medium.com/androiddevelopers/implementing-adaptive-icons-1e4d1795470e as source documentation.


## iOS Icon Specifics

iOS generation in [ios.ts](../src/ios.ts) produces PNGs for all required sizes/scales defined in `iosIcons` array, plus a `Contents.json` manifest for Xcode asset catalogs.

Use documentation at https://developer.apple.com/documentation/Xcode/configuring-your-app-icon for specifications.

## Configuration

Read from `app.json` under `svgAppIcon` key, or CLI flags. See README for full options.
