import * as fse from "fs-extra";
import path from "path";

// sharp library is slow to load, only import types here, and import when needed
import * as SharpType from "sharp";

const defaultBackgroundPath = path.join(
  __dirname,
  "..",
  "assets",
  "default-icon-background.svg"
);

export const inputImageSize = 108;
export const inputContentSize = 72;

export interface Config {
  backgroundPath: string;
  foregroundPath: string;
}

type FileModificationTime = fse.Stats["mtimeMs"];

export type FileInput = Input<InputData>;
type LoadedInput = Loaded<InputData>;
interface InputData {
  backgroundImageData: BackgroundImageData;
  foregroundImageData: ImageData;
}

export interface Input<Data extends object> {
  lastModified: FileModificationTime;
  read: () => Promise<Loaded<Data>>;
}

type Loaded<Data extends {}> = Data & {
  sharp: typeof SharpType.default;
};

interface ValidMetadata extends SharpType.Metadata {
  format: "svg";
  width: number;
  height: number;
  density: number;
}

interface OpaqueImageStats extends SharpType.Stats {
  isOpaque: true;
}

export interface ImageData {
  data: Buffer;
  metadata: ValidMetadata;
  stats: SharpType.Stats;
}

interface BackgroundImageData extends ImageData {
  stats: OpaqueImageStats;
}

export async function readIcon(config: Partial<Config>): Promise<FileInput> {
  if (config.backgroundPath) {
    console.debug("Reading background file", config.backgroundPath);
  }
  if (config.foregroundPath) {
    console.debug("Reading file", config.foregroundPath);
  }
  const fullConfig = getConfig(config);

  return {
    lastModified: await getLastModifiedTime(fullConfig),
    read: lazyLoadProvider(fullConfig)
  };
}

function getConfig(config: Partial<Config>): Config {
  return {
    backgroundPath: config.backgroundPath || defaultBackgroundPath,
    foregroundPath: config.foregroundPath || "./icon.svg"
  };
}

async function getLastModifiedTime(
  config: Config
): Promise<FileModificationTime> {
  const fileModifiedTimes = await Promise.all([
    fse.stat(config.backgroundPath).then(stat => stat.mtimeMs),
    fse.stat(config.foregroundPath).then(stat => stat.mtimeMs)
  ]);

  return Math.max(...fileModifiedTimes);
}

function lazyLoadProvider(config: Config): () => Promise<LoadedInput> {
  let lazyLoadedData: Promise<LoadedInput> | undefined = undefined;

  return function(): Promise<LoadedInput> {
    if (lazyLoadedData === undefined) {
      lazyLoadedData = loadData(config);
    }

    return lazyLoadedData;
  };
}

async function loadData(config: Config): Promise<Loaded<InputData>> {
  const sharpImport = await import("sharp");
  const warmedSharpInstance = await warmupSharp(sharpImport.default);
  const [backgroundImageData, foregroundImageData] = await Promise.all([
    readImage(warmedSharpInstance, config.backgroundPath),
    readImage(warmedSharpInstance, config.foregroundPath)
  ]);

  const validBackgroundImage = validateBackgroundImage(backgroundImageData);

  return {
    sharp: warmedSharpInstance,
    backgroundImageData: validBackgroundImage,
    foregroundImageData: foregroundImageData
  };
}

// First run might cause a xmllib error, run safe warmup
// See https://github.com/lovell/sharp/issues/1593
async function warmupSharp(
  sharp: typeof SharpType.default
): Promise<typeof SharpType.default> {
  try {
    await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" /></svg>`,
        "utf-8"
      )
    ).metadata();
  } catch {
    // Error only occurs once, so now safe to use sharp
  }

  return sharp;
}

async function readImage(
  sharp: typeof SharpType.default,
  filePath: string
): Promise<ImageData> {
  const fileData = await fse.readFile(filePath);

  const sharpInstance = sharp(fileData);
  const [metadata, stats] = await Promise.all([
    sharpInstance.metadata(),
    sharpInstance.stats()
  ]);

  const validMetadata = validateMetadata(metadata);

  return {
    data: fileData,
    metadata: validMetadata,
    stats: stats
  };
}

function validateMetadata(metadata: SharpType.Metadata): ValidMetadata {
  if (metadata.format !== "svg") {
    throw new Error(
      `Unsupported image format ${metadata.format}.` +
        `Only SVG images are supported.`
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

function validateBackgroundImage(imageData: ImageData): BackgroundImageData {
  if (imageData.stats.isOpaque) {
    return {
      ...imageData,
      stats: {
        ...imageData.stats,
        isOpaque: imageData.stats.isOpaque
      }
    };
  } else {
    throw new Error("Input image should be opaque");
  }
}

export function mapInput<
  OriginalData extends object,
  MappedData extends object
>(
  fileInput: Input<OriginalData>,
  mapFunction: (data: OriginalData) => MappedData
): Input<MappedData> {
  return {
    ...fileInput,
    read: async (): Promise<Loaded<MappedData>> => {
      const data = await fileInput.read();
      return {
        sharp: data.sharp,
        ...mapFunction(data)
      };
    }
  };
}
