import * as fse from "fs-extra";

// sharp library is slow to load, only import types here, and import when needed
import * as SharpType from "sharp";

export const inputImageSize = 108;
export const inputContentSize = 72;

export interface FileInput {
  fileStats: fse.Stats;
  read: () => Promise<LazyLoaded>;
}

interface LazyLoaded {
  sharp: typeof SharpType;
  imageData: ImageData;
}

interface ValidMetadata extends SharpType.Metadata {
  format: "svg";
  width: number;
  height: number;
  density: number;
}

interface ValidStats extends SharpType.Stats {
  isOpaque: true;
}

export interface ImageData {
  data: Buffer;
  metadata: ValidMetadata;
  stats: ValidStats;
}

export async function readFile(filePath: string): Promise<FileInput> {
  console.debug("Reading file", filePath);
  const fileStats = await fse.stat(filePath);

  return {
    fileStats: fileStats,
    read: lazyLoadProvider(filePath)
  };
}

function lazyLoadProvider(filePath: string): () => Promise<LazyLoaded> {
  let lazyLoadedData: Promise<LazyLoaded> | undefined = undefined;

  return function(): Promise<LazyLoaded> {
    if (lazyLoadedData === undefined) {
      lazyLoadedData = loadData(filePath);
    }

    return lazyLoadedData;
  };
}

async function loadData(filePath: string): Promise<LazyLoaded> {
  const sharpInstance = await import("sharp");
  const imageData = await readImage(sharpInstance, filePath);

  return {
    sharp: sharpInstance,
    imageData: imageData
  };
}

async function readImage(
  sharp: typeof SharpType,
  filePath: string
): Promise<ImageData> {
  const fileData = await fse.readFile(filePath);

  const sharpInstance = sharp(fileData);
  const [metadata, stats] = await Promise.all([
    sharpInstance.metadata(),
    sharpInstance.stats()
  ]);

  const validMetadata = validateMetadata(metadata);
  const validStats = validateStats(stats);

  return {
    data: fileData,
    metadata: validMetadata,
    stats: validStats
  };
}

function validateMetadata(metadata: SharpType.Metadata): ValidMetadata {
  if (metadata.format !== "svg") {
    throw new Error(
      `Unsupported image format ${
        metadata.format
      }. Only SVG images are supported.`
    );
  }

  if (!metadata.density || !metadata.width || !metadata.height) {
    throw new Error("Unsupported image, missing size and density");
  }

  if (metadata.width !== metadata.height) {
    throw new Error("Input image not square");
  }

  // TODO: Support different sized images
  if (metadata.width !== inputImageSize || metadata.height !== inputImageSize) {
    throw new Error("Input image size not 108x108");
  }

  return {
    ...metadata,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    density: metadata.density
  };
}

function validateStats(stats: SharpType.Stats): ValidStats {
  if (stats.isOpaque) {
    return {
      ...stats,
      isOpaque: stats.isOpaque
    };
  } else {
    throw new Error("Input image should be opaque");
  }
}
