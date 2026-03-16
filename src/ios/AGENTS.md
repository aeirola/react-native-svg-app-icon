# iOS Icon Generation

iOS generation in [index.ts](index.ts) produces PNGs for all required sizes/scales, plus a `Contents.json` manifest for Xcode asset catalogs.

## Files

- [config.ts](config.ts) - Output path auto-discovery and resolution
- [index.ts](index.ts) - Icon generation: composite SVG building, PNG rasterization, Contents.json manifest

## Output Path Auto-Discovery

[config.ts](config.ts) resolves the iOS output directory:
1. If `appName` provided, checks `ios/{appName}/Images.xcassets` first
2. Otherwise scans all `ios/*/Images.xcassets` directories
3. Appends `AppIcon.appiconset` to the selected directory
4. Throws if no `.xcassets` directory is found

## Icon Sizes

18 total variants covering all Apple devices:
- iPhone: 20, 29, 40, 60 at 2× and 3× scales
- iPad: 20, 29, 40, 76 at 1× and 2× scales
- iPad Pro: 83.5 at 2× scale
- App Store: 1024 at 1× scale

Filename format: `{idiom}-{size}@{scale}x.png` (e.g., `iphone-60@3x.png`)

## Generation Process

1. Builds composite SVG with background + foreground layers
2. Generates PNGs at each required size/scale
3. Generates `Contents.json` manifest with filename, idiom, scale, and size metadata for Xcode

## Reference Documentation

https://developer.apple.com/documentation/Xcode/configuring-your-app-icon
