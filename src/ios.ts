import * as fse from "fs-extra";
import * as path from "path";

import * as input from "./input";
import * as output from "./output";

const assetName = "AppIcon.appiconset";
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

export interface Config {
  iconsetDir: string;
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
    iconsetDir:
      config.iconsetDir || `./ios/${await getAppName()}/Images.xcassets`
  };
}

async function getAppName(): Promise<string> {
  const appJson = JSON.parse(await fse.readFile("./app.json", "utf-8"));
  return appJson.name;
}

async function* generateImages(
  config: Config,
  fileInput: input.FileInput
): AsyncIterable<string> {
  yield* output.genaratePngs(
    {
      ...fileInput,
      cropSize: input.inputContentSize
    },
    iosIcons.map(icon => ({
      filePath: path.join(config.iconsetDir, assetName, getIconFilename(icon)),
      flattenAlpha: icon.flattenAlpha,
      outputSize: icon.size * icon.scale
    }))
  );
}

async function* generateManifest(config: Config): AsyncIterable<string> {
  const fileName = path.join(config.iconsetDir, assetName, "Contents.json");
  yield* output.ensureFileContents(fileName, {
    images: iosIcons.map(icon => ({
      filename: getIconFilename(icon),
      idiom: icon.idiom,
      scale: `${icon.scale}x`,
      size: `${icon.size}x${icon.size}`
    })),
    info: {
      author: "react-native-svg-app-icon",
      version: 1
    }
  });
}

function getIconFilename(icon: {
  idiom: string;
  size: number;
  scale: number;
}): string {
  return `${icon.idiom}-${icon.size}@${icon.scale}x.png`;
}
