# Test Infrastructure

Tests use **Vitest** with extended timeouts (`testTimeout: 60s`) for resource-intensive image processing.

## Structure

- `test/utils/` - Shared test utilities
- `test/integration/` - End-to-end CLI tests
- `test/assets/` - Shared SVG fixture inputs (e.g., `react-icon.svg`, `text-icon.svg`)
- `src/**/*.test.ts` - Unit tests co-located with source files
- `src/**/*.test.assets/` - Fixture directories for unit tests

## Test Utilities (`test/utils/`)

- [file-comparison.ts](utils/file-comparison.ts) - `verifyGeneratedFiles(baseDir, options)`: auto-discovers files in `expected/` and compares against `output/`. PNG comparison via pixelmatch (with visual diff generation), parsed JSON comparison, or exact text match.
- [sharpmatch.ts](utils/sharpmatch.ts) - Pixel-by-pixel image comparison using Sharp and pixelmatch. Generates diff PNG when `diffOutputPath` provided.
- [cli-runner.ts](utils/cli-runner.ts) - `runCli(args, options)`: spawns CLI as a separate Node process. Returns `{ stdout, stderr, exitCode }`.
- [tmp-dir.ts](utils/tmp-dir.ts) - Vitest fixture providing a temp directory per test with auto-`chdir()` and cleanup.
- [context.ts](utils/context.ts) - `makeContext<C>(config)`: factory for test `Context` with silent logger and forced cache session.
- [cleanup.ts](utils/cleanup.ts) - `cleanupTestOutputs(basePath, testCases)`: removes `output/` and `diff/` directories before test runs.

## Fixture Directory Convention

Each test case directory follows:
```
{test-case}/
  input/     - Source files (SVG icons, app.json)
  expected/  - Reference output files to compare against
  output/    - Generated during tests (cleaned before each run)
  diff/      - Visual diff images for PNG mismatches (auto-generated)
```

## Integration Tests

[integration/integration.test.ts](integration/integration.test.ts) runs end-to-end CLI tests using fixture directories in `integration/assets/`. Since the tests execute the build output, the project needs to be built before running integration tests.

Each test copies input files to an output directory, runs the CLI, then verifies generated files match expected output. The `cache-test` fixture specifically validates incremental build behavior (skip on cache hit, regenerate with `--force`).

## Running Tests

```bash
npm test              # All checks: lint + types + unit tests
npm run test:unit     # Unit tests only (src/)
npm run test:integration  # Build + integration tests (test/integration/)
```
