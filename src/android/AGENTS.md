# Android Icon Generation

Android generation in [index.ts](index.ts) handles multiple icon types:
- Adaptive icons (SDK 26+): Vector drawable foreground/background with PNG fallback for complex SVGs
- Legacy square icons: PNG image including background and foreground image, with an applied rounded square mask and drop shadow
- Legacy round icons: PNG image including background and foreground image, with an applied circular mask and drop shadow

## Files

- [config.ts](config.ts) - `Config` types
- [index.ts](index.ts) - Orchestrates all Android icon generation
- [resources.ts](resources.ts) - Resource density definitions, icon name constants, and path construction (`getIconPath()`)

### adaptive/

- [adaptive-icons.ts](adaptive/adaptive-icons.ts) - Generates Android 8.0+ adaptive icons. Attempts vector drawable conversion for background/foreground; falls back to PNG at each density on failure. Creates `<adaptive-icon>` XML referencing background/foreground drawables.
- [vector-drawable.ts](adaptive/vector-drawable.ts) - SVG → Android Vector Drawable XML via `svg2vectordrawable`. Failure triggers PNG fallback in the caller.

### legacy/

- [square-icons.ts](legacy/square-icons.ts) - Pre-Android 8.0 square icons: composites background+foreground into 48×48dp, applies drop shadow and shaded edge filters
- [round-icons.ts](legacy/round-icons.ts) - Pre-Android 8.0 round icons: circular mask variant
- [shapes.ts](legacy/shapes.ts) - SVG shape definitions and sizing constants based on Android Image Studio
- [lightning-filter.ts](legacy/lightning-filter.ts) - SVG filter effects based on Android Image Studio

## Resource Densities

PNGs are generated at `mdpi` (1×), `hdpi` (1.5×), `xhdpi` (2×), `xxhdpi` (3×), `xxxhdpi` (4×). Vector drawables use `anydpi` qualifier. Resource paths follow `{androidOutputPath}/{mipmap|drawable}-{density}[-v{minApi}]/{fileName}`.

## Reference Documentation

- Legacy icons: https://m2.material.io/design/platform-guidance/android-icons.html
- Adaptive icons: https://developer.android.com/develop/ui/views/launch/icon_design_adaptive and https://medium.com/androiddevelopers/implementing-adaptive-icons-1e4d1795470e
