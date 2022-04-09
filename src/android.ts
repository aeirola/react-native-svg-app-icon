import * as path from "path";
import svg2vectordrawable from "svg2vectordrawable";

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
const launcherBackgroundName = "ic_launcher_background";
const launcherForegroundName = "ic_launcher_foreground";

/** Adaptive Icon **/
const adaptiveIconBaseSize = 108;
const adaptiveIconContent = (
  launcherBackgroundType: ResourceType,
  launcherForegroundType: ResourceType
): string => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@${launcherBackgroundType}/${launcherBackgroundName}" />
    <foreground android:drawable="@${launcherForegroundType}/${launcherForegroundName}" />
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

const legacySquareIconMask = Buffer.from(
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
    />
</svg>`,
  "utf-8"
);

const legacySquareIconOverlay = Buffer.from(
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacySquareIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <rect
      x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
      width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
      rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`,
  "utf-8"
);

/** Legacy Round Icon **/
const legacyRoundIconContentSize = 44;
const legacyRoundIconContentRatio =
  legacyRoundIconContentSize / legacyIconBaseSize;

const roundIconMask = Buffer.from(
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
    />
</svg>`,
  "utf-8"
);

const roundIconOverlay = Buffer.from(
  `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
  viewBox="${getViewBox(legacyRoundIconContentSize)}"
  width="${input.inputImageSize}" height="${input.inputImageSize}">
    ${legacyLightningFilter}
    <circle
      cx="${legacyIconBaseSize / 2}" cy="${legacyIconBaseSize / 2}"
      r="${legacyRoundIconContentSize / 2}"
      filter="url(#legacyLightningFilter)"
    />
</svg>`,
  "utf-8"
);

function getViewBox(input: number): string {
  const size = input / inputIconContentRatio;
  const margin = (size - legacyIconBaseSize) / 2;
  const viewBox = [-margin, -margin, size, size];
  return viewBox.join(" ");
}

export interface Config extends output.OutputConfig {
  androidOutputPath: string;
}

export async function* generate(
  config: Partial<Config>,
  fileInput: input.FileInput
): AsyncIterable<string> {
  const fullConfig = getConfig(config);
  yield* generateLegacyIcons(fileInput, fullConfig);
  yield* generateRoundIcons(fileInput, fullConfig);
  yield* generateAdaptiveIcon(fileInput, fullConfig);
}

function getConfig(config: Partial<Config>): Config {
  return {
    androidOutputPath: config.androidOutputPath || "./android/app/src/main/res",
    force: config.force || false
  };
}

async function* generateLegacyIcons(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...input.mapInput(fileInput, (inputData) => ({
        baseImage: inputData.backgroundImageData,
        operations: [
          { type: "composite", file: inputData.foregroundImageData.data },
          { type: "composite", blend: "mask", file: legacySquareIconMask },
          { type: "composite", file: legacySquareIconOverlay }
        ]
      })),
      cropSize: input.inputContentSize / legacySquareIconContentRatio
    },
    densities.map((density) => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name },
        `${launcherName}.png`
      ),
      outputSize: legacyIconBaseSize * density.scale,
      force: config.force
    }))
  );
}

async function* generateRoundIcons(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...input.mapInput(fileInput, (inputData) => ({
        baseImage: inputData.backgroundImageData,
        operations: [
          { type: "composite", file: inputData.foregroundImageData.data },
          { type: "composite", blend: "mask", file: roundIconMask },
          { type: "composite", file: roundIconOverlay }
        ]
      })),
      cropSize: input.inputContentSize / legacyRoundIconContentRatio
    },
    densities.map((density) => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name },
        `${roundIconName}.png`
      ),
      outputSize: legacyIconBaseSize * density.scale,
      force: config.force
    }))
  );
}

async function* generateAdaptiveIcon(
  fileInput: input.FileInput,
  config: Config
): AsyncIterable<string> {
  const backgroundImageInput = input.mapInput(fileInput, (inputData) => ({
    image: inputData.backgroundImageData
  }));
  let backgroundResourceType: ResourceType;
  try {
    yield* generateAdaptiveIconLayerVd(
      backgroundImageInput,
      launcherBackgroundName,
      config
    );
    backgroundResourceType = "drawable";
  } catch {
    yield* generateAdaptiveIconLayerPng(
      backgroundImageInput,
      launcherBackgroundName,
      config
    );
    backgroundResourceType = "mipmap";
  }

  const foregroundImageInput = input.mapInput(fileInput, (inputData) => ({
    image: inputData.foregroundImageData
  }));
  let foregroundResourceType: ResourceType;
  try {
    yield* generateAdaptiveIconLayerVd(
      foregroundImageInput,
      launcherForegroundName,
      config
    );
    foregroundResourceType = "drawable";
  } catch {
    yield* generateAdaptiveIconLayerPng(
      foregroundImageInput,
      launcherForegroundName,
      config
    );
    foregroundResourceType = "mipmap";
  }

  // Adaptive icon
  const adaptiveIconXml = adaptiveIconContent(
    backgroundResourceType,
    foregroundResourceType
  );
  yield* output.ensureFileContents(
    getIconPath(
      config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${launcherName}.xml`
    ),
    adaptiveIconXml,
    config
  );
  yield* output.ensureFileContents(
    getIconPath(
      config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${roundIconName}.xml`
    ),
    adaptiveIconXml,
    config
  );
}

async function* generateAdaptiveIconLayerVd(
  imageInput: input.Input<{ image: input.ImageData }>,
  fileName: string,
  config: Config
): AsyncIterable<string> {
  const imageData = await imageInput.read();
  const vdData = await svg2vectordrawable(
    imageData.image.data.toString("utf-8"),
    {
      // Fail on unsupported elements, so that we fall back to PNG rendering
      strict: true,
      // Use same default fill behaviour as in SVG spec
      fillBlack: true
    }
  );
  yield* output.ensureFileContents(
    getIconPath(
      config,
      "drawable",
      { density: "anydpi", minApiLevel: 26 },
      `${fileName}.xml`
    ),
    vdData,
    config
  );
}

async function* generateAdaptiveIconLayerPng(
  imageInput: input.Input<{ image: input.ImageData }>,
  fileName: string,
  config: Config
): AsyncIterable<string> {
  yield* output.genaratePngs(
    input.mapInput(imageInput, (imageData) => ({
      baseImage: imageData.image
    })),
    densities.map((density) => ({
      filePath: getIconPath(
        config,
        "mipmap",
        { density: density.name, minApiLevel: adaptiveIconMinSdk },
        `${fileName}.png`
      ),
      outputSize: adaptiveIconBaseSize * density.scale,
      force: config.force
    }))
  );
}

type ResourceType = "mipmap" | "drawable";

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
  resourceType: ResourceType,
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
  return path.join(config.androidOutputPath, directoryName.join("-"), fileName);
}
