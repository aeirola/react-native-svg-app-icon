import * as fse from "fs-extra";
import * as path from "path";

import * as input from "./input";
import sharp = require("sharp");

interface GenerateInput extends input.FileInput {
  mask?: string;
  cropSize?: number;
}

interface GenerateConfig {
  filePath: string;
  outputSize: number;
}

export async function* genaratePngs(
  fileInput: GenerateInput,
  outputs: GenerateConfig[]
): AsyncIterable<string> {
  for await (let output of outputs) {
    yield* genaratePng(fileInput, output);
  }
}

async function* genaratePng(
  fileInput: GenerateInput,
  output: GenerateConfig
): AsyncIterable<string> {
  if (!(await hasChanged(fileInput, output))) {
    return;
  }

  const { sharp, imageData } = await fileInput.read();
  const metadata = imageData.metadata;

  await fse.ensureDir(path.dirname(output.filePath));

  const scale =
    fileInput.cropSize === undefined
      ? 1
      : input.inputImageSize / fileInput.cropSize;
  const targetDensity =
    (output.outputSize / metadata.width) * metadata.density * scale;
  let image = sharp(imageData.data, {
    density: targetDensity
  });

  const extractRegion = getExtractRegion(
    targetDensity,
    metadata,
    output.outputSize
  );
  image = image.extract(extractRegion);

  if (fileInput.mask) {
    image = image.composite([
      {
        input: await sharp(Buffer.from(fileInput.mask, "utf-8"), {
          // TODO: Ensure correct density on differing input image sizes
          density: targetDensity
        })
          // TODO: Check github issues why we need to extract here as well
          .extract(extractRegion)
          .toBuffer(),
        blend: "dest-in"
      }
    ]);
  } else {
    image = image.removeAlpha();
  }

  await image
    .png({
      adaptiveFiltering: false,
      compressionLevel: 9
    })
    .toFile(output.filePath);

  yield output.filePath;
}

function getExtractRegion(
  targetDensity: number,
  metadata: input.ImageData["metadata"],
  outputSize: number
): sharp.Region {
  // Android Studio seems to use floor for crop pixel alignment
  // so we just follow suit for consistency
  const imageMargin = Math.floor(
    ((targetDensity / metadata.density) * metadata.width - outputSize) / 2
  );

  return {
    top: imageMargin,
    left: imageMargin,
    width: outputSize,
    height: outputSize
  };
}

async function hasChanged(
  input: input.FileInput,
  output: GenerateConfig
): Promise<boolean> {
  const inputStat = input.fileStats;
  let outputStat: fse.Stats | null;
  try {
    outputStat = await fse.stat(output.filePath);
  } catch {
    return true;
  }

  if (inputStat.mtimeMs > outputStat.mtimeMs) {
    return true;
  } else {
    return false;
  }
}

export async function* ensureFileContents(
  path: string,
  content: string | object
): AsyncIterable<string> {
  let stringContent;
  switch (typeof content) {
    case "object":
      stringContent = JSON.stringify(content, undefined, 2);
      break;
    case "string":
      stringContent = content;
      break;
    default:
      throw Error("Invalid content");
  }
  const contentBuffer = Buffer.from(stringContent, "utf-8");

  let equal;
  try {
    const diskFileBuffer = await fse.readFile(path);
    equal = diskFileBuffer.equals(contentBuffer);
  } catch {
    equal = false;
  }

  if (equal) {
    return;
  } else {
    await fse.outputFile(path, contentBuffer);
    yield path;
  }
}
