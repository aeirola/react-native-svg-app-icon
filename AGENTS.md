# react-native-svg-app-icon

## Project Overview

CLI tool that generates iOS and Android app launcher icons from SVG source files for React Native projects. Converts a single 108x108 SVG into platform-specific assets: iOS PNGs, Android adaptive icons (vector drawable with PNG fallback), and legacy square/round icons.

## Key Design Patterns

**Async Iterables for Output**: All generators use `async function*` to yield file paths as they're written:
```typescript
export async function* generate(config: Config): AsyncIterable<string> {
  yield* android.generate(config, iconInput);
  yield* ios.generate(config, iconInput);
}
```

**Lazy Loading**: Sharp library is loaded only when needed (expensive import).

**Incremental Builds**: Output files are skipped if their cached content hash matches the current input file hash (unless `force: true`). Hashes are stored in a cache file and compared on each run.

## Development Workflow

```bash
npm install           # Install dependencies
npm run prepare       # Build TypeScript → lib/ (runs automatically on install)
npm test              # Run all checks in parallel (lint, types, unit tests)
npm run test:unit     # Run vitest tests only
```

### Testing

Tests use **Vitest** and are organized into two categories:

- **Unit tests** (`src/**/*.test.ts`): Co-located with source files, test individual modules. Fixture assets live in adjacent `*.test.assets/` directories (e.g., `adaptive-icons.test.assets/`).
- **Integration tests** (`test/integration/`): End-to-end CLI tests that run the full generation pipeline via `runCli()` helper.

**Test utilities** in `test/utils/` — see [test/AGENTS.md](test/AGENTS.md) for details.

**Fixture directory convention**: Each test case directory contains:
- `input/` — Source files (SVG icons, `app.json`)
- `expected/` — Reference output files to compare against
- `output/` — Generated during tests (cleaned up by `beforeAll`)
- `diff/` — Visual diff images for PNG comparison (auto-generated)

Shared test SVG inputs are in `test/assets/`.

**tmpDir fixture pattern** for tests needing a working directory:
```typescript
import { it as base } from "vitest";
import { tmpDir } from "../../test/utils/tmp-dir";

const it = base.extend({ tmpDir });

it("my test", async ({ tmpDir: _tmpDir }) => {
  // cwd is now a temp directory, cleaned up after test
});
```

**Output verification pattern** for fixture-based tests:
```typescript
beforeAll(async () => {
  await cleanupTestOutputs(assetsPath, ["test-case-1", "test-case-2"]);
});

it("generates expected output", async () => {
  // ... run generation into baseDir/output/ ...
  await verifyGeneratedFiles(baseDir, { imageThreshold: 0.1 });
});
```

PNG comparison thresholds range from 0 (default, exact match) to 0.16 depending on test tolerance needs.

### Build Artifacts

- Source: `src/*.ts` → Compiled: `lib/*.js` (CommonJS)
- Published files: `lib/` and `assets/`
- Two tsconfig files: `tsconfig.json` (type checking, noEmit) and `tsconfig.build.json` (actual build)

## Code Style

- **Biome** for linting/formatting (not ESLint/Prettier)
- Run `npx biome check` or use IDE integration
- Example directories (`example-rn/`, `example-expo/`) are excluded from linting
- **Strict TypeScript**: Rely on precise, strict types throughout. Avoid `any` and `as` type assertions, prefer narrow types, and leverage TypeScript's type system fully.
- **Input validation with arktype**: All external input (CLI args, `app.json` config, file contents) must be validated using [arktype](https://arktype.io). Use Context7 library documentation `/arktypeio/arktype` for API and docs.

## Key Dependencies

- **sharp**: SVG → PNG rasterization (handles density/DPI scaling). Use Context7 library documentation `/lovell/sharp` for API and docs.
- **svg2vectordrawable**: SVG → Android vector drawable XML conversion
- **commander**: CLI argument parsing
- **fs-extra**: Enhanced file system operations

Always use Context7 MCP when library/API documentation, code generation, setup, or configuration steps are needed, without requiring an explicit request.

## Configuration

Read from `app.json` under `svgAppIcon` key, or CLI flags. See README for full options.
