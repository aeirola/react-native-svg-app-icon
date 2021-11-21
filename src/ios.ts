import * as fse from "fs-extra";
import * as path from "path";

import * as input from "./input";
import * as output from "./output";

const iosIcons = [
  { idiom: "iphone", scale: 2, size: 20 },
  { idiom: "iphone", scale: 3, size: 20 },
  { idiom: "iphone", scale: 2, size: 29 },
  { idiom: "iphone", scale: 3, size: 29 },
  { idiom: "iphone", scale: 2, size: 40 },
  { idiom: "iphone", scale: 3, size: 40 },
  { idiom: "iphone", scale: 2, size: 60 },
  { idiom: "iphone", scale: 3, size: 60 },
  { idiom: "ipad", scale: 1, size: 20 },
  { idiom: "ipad", scale: 2, size: 20 },
  { idiom: "ipad", scale: 1, size: 29 },
  { idiom: "ipad", scale: 2, size: 29 },
  { idiom: "ipad", scale: 1, size: 40 },
  { idiom: "ipad", scale: 2, size: 40 },
  { idiom: "ipad", scale: 1, size: 76 },
  { idiom: "ipad", scale: 2, size: 76 },
  { idiom: "ipad", scale: 2, size: 83.5 },
  { idiom: "ios-marketing", scale: 1, size: 1024, flattenAlpha: true }
];

export interface Config extends output.OutputConfig {
  iosOutputPath: string;
}
export async function* generate(
  config: Partial<Config>,
  fileInput: input.FileInput
): AsyncIterable<string> {
  const fullConfig = await getConfig(config);

  yield* generateImages(fullConfig, fileInput);
  yield* generateManifest(fullConfig);
}

async function getConfig(config: Partial<Config>): Promise<Config> {
  return {
    iosOutputPath: config.iosOutputPath || (await getIconsetDir()),
    force: config.force || false
  };
}

async function getIconsetDir(): Promise<string> {
  for (const fileName of await fse.readdir("ios")) {
    const testPath = path.join("ios", fileName, "Images.xcassets");
    if (
      (await fse.pathExists(testPath)) &&
      (await fse.stat(testPath)).isDirectory
    ) {
      return path.join(testPath, "AppIcon.appiconset");
    }
  }

  throw new Error("No Images.xcassets found under ios/ subdirectories");
}

async function* generateImages(
  config: Config,
  fileInput: input.FileInput
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...input.mapInput(fileInput, (inputData) => ({
        baseImage: inputData.backgroundImageData,
        operations: [
          { type: "composite", file: inputData.foregroundImageData.data },
          { type: "remove-alpha" }
        ]
      })),
      cropSize: input.inputContentSize
    },
    iosIcons.map((icon) => ({
      filePath: path.join(config.iosOutputPath, getIconFilename(icon)),
      flattenAlpha: icon.flattenAlpha,
      outputSize: icon.size * icon.scale,
      force: config.force
    }))
  );
}

async function* generateManifest(config: Config): AsyncIterable<string> {
  const fileName = path.join(config.iosOutputPath, "Contents.json");
  yield* output.ensureFileContents(
    fileName,
    {
      images: iosIcons.map((icon) => ({
        filename: getIconFilename(icon),
        idiom: icon.idiom,
        scale: `${icon.scale}x`,
        size: `${icon.size}x${icon.size}`
      })),
      info: {
        author: "react-native-svg-app-icon",
        version: 1
      }
    },
    config
  );
}

function getIconFilename(icon: {
  idiom: string;
  size: number;
  scale: number;
}): string {
  return `${icon.idiom}-${icon.size}@${icon.scale}x.png`;
}
