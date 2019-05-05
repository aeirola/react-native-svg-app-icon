# Test fixture icons

Fixture explanations:

- `example`: Icon used for example app, based on React Native logo
- `white`: Completely white icon, for testing legacy shades

## Android icons

Adaptive icons are generated with the same tooling, and only test for regression issues.

Legacy icons are generated using Android Image Asset Studio, and will contain some small differences to the output of the tool. This tests for compatibility with the native platform tooling.

## iOS

All icons are generated with the same tooling, and only test for regression issues.

## Generating icons

```bash
# Build code
npm run build
# Navigate to desired fixture
cd src/__tests__/fixtures/example/
# Run code
../../../../lib/cli.js
```
