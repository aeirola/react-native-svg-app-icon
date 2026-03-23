# Core Library Structure

- [index.ts](index.ts) - Main entry point, orchestrates platform generators via async iterables
- [util/](util/) - Shared utilities: SVG/PNG handling with Sharp, file output, logging, memoization
- [ios/](ios/) - iOS icon generation (PNGs + Contents.json manifest)
- [android/](android/) - Android icon generation (vector drawables, adaptive icons, legacy icons)
- [cache/](cache/) - Incremental build support via content hashing
