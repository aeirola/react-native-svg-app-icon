import * as path from "path";

import * as input from "./input";
import * as output from "./output";

const adaptiveIconMinSdk = 26;

const densities: { name: ResourceDensity; scale: number }[] = [
  { name: "mdpi", scale: 1 },
  { name: "hdpi", scale: 1.5 },
  { name: "xhdpi", scale: 2 },
  { name: "xxhdpi", scale: 3 },
  { name: "xxxhdpi", scale: 4 }
];

const launcherName = "ic_launcher";
const roundIconName = "ic_launcher_round";
const launcherForegroundName = "ic_launcher_foreground";

/** Adaptive Icon **/
const adaptiveIconBaseSize = 108;
const adaptiveIconContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/white" />
    <foreground android:drawable="@mipmap/${launcherForegroundName}" />
</adaptive-icon>`;

/** Legacy Icon **/

const legacyIconBaseSize = 48;
const inputIconContentRatio = input.inputContentSize / input.inputImageSize;

// Based on images from image asset studio at
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/resources/images/launcher_stencil/
// https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java
const legacyLightningFilter = `
  <filter id="legacyLightningFilter">
    <!-- Drop shadow -->
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.4" />
    <feOffset dx="0" dy="1.125" />
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.2"/>
    </feComponentTransfer>
    <feComposite in2="SourceAlpha" operator="out"
      result="shadow"
    />

    <!-- Edge shade -->
    <feComponentTransfer in="SourceAlpha" result="opaque-alpha">
      <feFuncA type="linear" slope="0.2"/>
    </feComponentTransfer>
    <feOffset dx="-0.2" dy="-0.2" in="SourceAlpha" result="offset-alpha" />
    <feComposite in="opaque-alpha" in2="offset-alpha" operator="out"
      result="edge"
    />

    <feMerge>
      <feMergeNode in="shadow" />
      <feMergeNode in="edge" />
    </feMerge>
  </filter>`;

/** Legacy Square Icon **/
const legacySquareIconContentSize = 38;
const legacySquareIconBorderRadius = 3;
const legacySquareIconMargin =
  (legacyIconBaseSize - legacySquareIconContentSize) / 2;
const legacySquareIconContentRatio =
  legacySquareIconContentSize / legacyIconBaseSize;

const legacySquareIconMask = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
    />
</svg>`;

const legacySquareIconOverlay = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`;

/** Legacy Round Icon **/
const legacyRoundIconContentSize = 44;
const legacyRoundIconContentRatio =
  legacyRoundIconContentSize / legacyIconBaseSize;

const roundIconMask = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
    />
</svg>`;

const roundIconOverlay = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`;

function getViewBox(input: number): string {
  const size = input / inputIconContentRatio;
  const margin = (size - legacyIconBaseSize) / 2;
  const viewBox = [-margin, -margin, size, size];
  return viewBox.join(" ");
}

export interface Config {
  resDirPath: string;
}

export async function* generate(
  config: Partial<Config>,
  fileInput: input.FileInput
): AsyncIterable<string> {
  const fullConfig = await getConfig(config);
  yield* generateLegacyIcons(fileInput, fullConfig);
  yield* generateRoundIcons(fileInput, fullConfig);
  yield* generateAdaptiveIcon(fileInput, fullConfig);
}

async function getConfig(config: Partial<Config>): Promise<Config> {
  return {
    resDirPath: config.resDirPath || "./android/app/src/main/res"
  };
}

async function* generateLegacyIcons(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...fileInput,
      mask: legacySquareIconMask,
      overlay: legacySquareIconOverlay,
      cropSize: input.inputContentSize / legacySquareIconContentRatio
    },
    densities.map(density => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name },
        `${launcherName}.png`
      ),
      outputSize: legacyIconBaseSize * density.scale
    }))
  );
}

async function* generateRoundIcons(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...fileInput,
      mask: roundIconMask,
      overlay: roundIconOverlay,
      cropSize: input.inputContentSize / legacyRoundIconContentRatio
    },
    densities.map(density => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name },
        `${roundIconName}.png`
      ),
      outputSize: legacyIconBaseSize * density.scale
    }))
  );
}

async function* generateAdaptiveIcon(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  // Foreground
  yield* output.genaratePngs(
    fileInput,
    densities.map(density => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name, minApiLevel: adaptiveIconMinSdk },
        `${launcherForegroundName}.png`
      ),
      outputSize: adaptiveIconBaseSize * density.scale
    }))
  );
  // Adaptive icon
  yield* output.ensureFileContents(
    getIconPath(
      config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${launcherName}.xml`
    ),
    adaptiveIconContent
  );
  yield* output.ensureFileContents(
    getIconPath(
      config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${roundIconName}.xml`
    ),
    adaptiveIconContent
  );
}

type ResourceDensity =
  | "ldpi"
  | "mdpi"
  | "hdpi"
  | "xhdpi"
  | "xxhdpi"
  | "xxxhdpi"
  | "anydpi";

function getIconPath(
  config: Config,
  resourceType: "mipmap" | "drawable",
  qualifier: {
    density: ResourceDensity;
    minApiLevel?: number;
  },
  fileName: string
): string {
  let directoryName: string[] = [resourceType];
  if (qualifier.density) {
    directoryName = [...directoryName, qualifier.density];
  }

  if (qualifier.minApiLevel) {
    directoryName = [...directoryName, `v${qualifier.minApiLevel}`];
  }
  return path.join(config.resDirPath, directoryName.join("-"), fileName);
}
