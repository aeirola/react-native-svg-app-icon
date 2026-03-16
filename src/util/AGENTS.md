# Utilities

Shared infrastructure used across all platform generators.

## Files

- [context.ts](context.ts) - `Context<Config>` interface passed through the generation pipeline (config, logger, cache). Generic over config type so each module declares only the fields it needs.
- [input.ts](input.ts) - SVG input loading, validation, and lazy image data.
- [output.ts](output.ts) - File generation with cache-aware skip logic. `generatePngs()` for batch PNG output, `generateFile()` for single files (JSON, XML, text).
- [logger.ts](logger.ts) - Leveled logging: `"silent" | "error" | "warn" | "info" | "debug"`. Factory: `createLogger(level)`.
- [memoize.ts](memoize.ts) - Caches result of zero-argument functions. Used for lazy-loaded expensive operations (input data).
- [svg.ts](svg.ts) - SVG preprocessing via SVGO: strips XML declarations, prefixes IDs to prevent collisions when inlining multiple SVGs.
- [version.ts](version.ts) - Reads package version from `package.json` for cache invalidation.
- [optional.ts](optional.ts) - `Optional<T>` type utility: all properties optional and explicitly `undefined`-able.

## Key Patterns

**Lazy Sharp Loading**: The `sharp` library is expensive to import. [input.ts](input.ts) uses type-only imports at the top level and `await import("sharp")` dynamically only when image processing is needed.

**Input Validation** ([input.ts](input.ts)): Validates that SVG inputs are actually SVG format, that background is square and fully opaque, and that images are 108×108. Falls back to a bundled default background SVG (`assets/default-icon-background.svg`) when no background is provided.

**Cache-Aware Output** ([output.ts](output.ts)): Every `generate*()` call first checks `cache.isUpToDate()` before generating. If up-to-date, the file is skipped and not yielded. After writing, the hash is recorded via `cache.recordBuffer()`.

**Density-Aware PNG Generation** ([output.ts](output.ts)): PNGs are rasterized from SVG at the target size using Sharp's `density` parameter to ensure crisp output at all resolutions.
