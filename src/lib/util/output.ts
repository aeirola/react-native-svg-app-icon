import * as fse from "fs-extra";
import type * as input from "./input";
import type { Context } from "./context";
import type { Task } from "../tasks";

interface GenerateInput {
  image: input.Input<input.ImageData>;
  /** Remove alpha channel from the output image. */
  removeAlpha?: boolean;
}

interface GenerateConfig {
  filePath: string;
  outputSize: number;
}

const pendingWritesByCache = new WeakMap<object, Map<string, Promise<void>>>();

function getPendingWrites(cache: object): Map<string, Promise<void>> {
  let pendingWrites = pendingWritesByCache.get(cache);
  if (!pendingWrites) {
    pendingWrites = new Map<string, Promise<void>>();
    pendingWritesByCache.set(cache, pendingWrites);
  }
  return pendingWrites;
}

export async function* generatePngs(
  fileInput: GenerateInput,
  outputs: GenerateConfig[],
  context: Context,
): AsyncIterable<Task> {
  for (const output of outputs) {
    yield* generatePng(fileInput, output, context);
  }
}

async function* generatePng(
  fileInput: GenerateInput,
  output: GenerateConfig,
  context: Context,
): AsyncIterable<Task> {
  yield* generateFile(
    output.filePath,
    async () => {
      const sharp = (await import("sharp")).default;
      const inputImage = await fileInput.image.read();
      const metadata = inputImage.metadata;

      const targetDensity = (output.outputSize / metadata.width) * metadata.density;

      let image = sharp(inputImage.data, { density: targetDensity });

      if (fileInput.removeAlpha) {
        image = image.removeAlpha();
      }

      return image
        .png({
          adaptiveFiltering: false,
          compressionLevel: 9,
        })
        .toBuffer();
    },
    context,
  );
}

/**
 * Generates a file at the given path with content provided by `contentProvider`.
 *
 * If the file is already up to date according to the cache session, generation
 * is skipped entirely and `contentProvider` is not called. Otherwise,
 * `contentProvider` is called to produce the file contents, which are written
 * to disk and recorded in the cache.
 *
 * @param path - Destination file path to write.
 * @param contentProvider - Called to produce file contents when the file needs
 *   to be (re-)generated. Strings and objects are UTF-8 encoded (objects are
 *   JSON-serialised); Buffers are written as-is.
 * @param context - Generation context supplying the cache session.
 * @yields A write task for the file when generation is needed; yields nothing if skipped.
 */
export async function* generateFile(
  filePath: string,
  contentProvider:
    | (() => string | Record<string, unknown> | Buffer)
    | (() => Promise<string | Record<string, unknown> | Buffer>),
  { cache, logger }: Context,
): AsyncIterable<Task> {
  const pendingWrites = getPendingWrites(cache);
  let finishPendingWrite!: () => void;
  const pendingWritePromise = new Promise<void>((resolve) => {
    finishPendingWrite = resolve;
  });

  while (true) {
    const existingPendingWrite = pendingWrites.get(filePath);
    if (!existingPendingWrite) {
      pendingWrites.set(filePath, pendingWritePromise);
      break;
    }
    await existingPendingWrite;
  }

  const releasePendingWrite = () => {
    if (pendingWrites.get(filePath) === pendingWritePromise) {
      pendingWrites.delete(filePath);
    }
    finishPendingWrite();
  };

  if (await cache.isUpToDate(filePath)) {
    logger?.debug(`Skipping ${filePath} (up to date)`);
    releasePendingWrite();
    return;
  }

  yield {
    filePath,
    run: async (): Promise<void> => {
      try {
        const content = await contentProvider();
        let contentBuffer: Buffer;
        if (Buffer.isBuffer(content)) {
          contentBuffer = content;
        } else {
          let stringContent: string;
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
          contentBuffer = Buffer.from(stringContent, "utf-8");
        }

        await fse.outputFile(filePath, contentBuffer);
        cache.recordBuffer(filePath, contentBuffer);
      } finally {
        releasePendingWrite();
      }
    },
  };
}
