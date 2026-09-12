import * as input from "../../util/input";
import * as output from "../../util/output";
import {
  type ResourceType,
  densities,
  getIconPath,
  launcherBackgroundName,
  launcherForegroundName,
  launcherName,
  roundIconName,
} from "../resources";
import { type Task, withTaskFallback } from "../../tasks";
import type { Context } from "../../util/context";
import type { ResolvedConfig } from "../config";
import { generateVectorDrawable } from "./vector-drawable";

const adaptiveIconMinSdk = 26;
const adaptiveIconBaseSize = 108;

const adaptiveIconContent = (
  launcherBackgroundType: ResourceType,
  launcherForegroundType: ResourceType,
): string => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@${launcherBackgroundType}/${launcherBackgroundName}" />
    <foreground android:drawable="@${launcherForegroundType}/${launcherForegroundName}" />
</adaptive-icon>`;

export async function* generateAdaptiveIcons(
  fileInput: input.FileInput,
  context: Context<ResolvedConfig>,
): AsyncIterable<Task> {
  const backgroundImageInput = input.mapInput(
    fileInput,
    (inputData) => inputData.backgroundImageData,
  );
  const foregroundImageInput = input.mapInput(
    fileInput,
    (inputData) => inputData.foregroundImageData,
  );
  const backgroundResourceType = createDeferred<ResourceType>();
  const foregroundResourceType = createDeferred<ResourceType>();

  yield* generateVectorDrawableWithFallback(
    backgroundImageInput,
    launcherBackgroundName,
    "background",
    context,
    backgroundResourceType.resolve,
    backgroundResourceType.reject,
  );
  yield* generateVectorDrawableWithFallback(
    foregroundImageInput,
    launcherForegroundName,
    "foreground",
    context,
    foregroundResourceType.resolve,
    foregroundResourceType.reject,
  );
  yield* generateAdaptiveIconLayerPng(
    backgroundImageInput,
    launcherBackgroundName,
    context,
    backgroundResourceType.promise,
  );
  yield* generateAdaptiveIconLayerPng(
    foregroundImageInput,
    launcherForegroundName,
    context,
    foregroundResourceType.promise,
  );

  // Adaptive icon
  yield* output.generateFile(
    getIconPath(
      context.config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${launcherName}.xml`,
    ),
    async () =>
      adaptiveIconContent(
        await backgroundResourceType.promise,
        await foregroundResourceType.promise,
      ),
    context,
  );
  yield* output.generateFile(
    getIconPath(
      context.config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${roundIconName}.xml`,
    ),
    async () =>
      adaptiveIconContent(
        await backgroundResourceType.promise,
        await foregroundResourceType.promise,
      ),
    context,
  );
}

async function* generateAdaptiveIconLayerPng(
  imageInput: input.Input<input.ImageData>,
  fileName: string,
  context: Context<ResolvedConfig>,
  layerResourceType: Promise<ResourceType>,
): AsyncIterable<Task> {
  for await (const task of output.generatePngs(
    { image: imageInput },
    densities.map((density) => ({
      filePath: getIconPath(
        context.config,
        "mipmap",
        { density: density.name, minApiLevel: adaptiveIconMinSdk },
        `${fileName}.png`,
      ),
      outputSize: adaptiveIconBaseSize * density.scale,
    })),
    context,
  )) {
    yield {
      run: async (): Promise<string | undefined> => {
        if ((await layerResourceType) !== "mipmap") {
          return undefined;
        }
        return await task.run();
      },
    };
  }
}

async function* generateVectorDrawableWithFallback(
  imageInput: input.Input<input.ImageData>,
  fileName: string,
  layerName: "background" | "foreground",
  context: Context<ResolvedConfig>,
  resolveLayerResourceType: (type: ResourceType) => void,
  rejectLayerResourceType: (reason: unknown) => void,
): AsyncIterable<Task> {
  for await (const task of generateVectorDrawable(imageInput, fileName, context)) {
    yield withTaskFallback(
      {
        run: async (): Promise<string | undefined> => {
          const filePath = await task.run();
          resolveLayerResourceType("drawable");
          return filePath;
        },
      },
      (error): Task => {
        if (isVectorDrawableConversionError(error)) {
          context.logger?.warn(
            `Vector drawable conversion failed for ${layerName}, falling back to PNG: ${error.cause instanceof Error ? error.cause.message : error.message}`,
          );
          resolveLayerResourceType("mipmap");
          return {
            run: async (): Promise<undefined> => undefined,
          };
        }
        rejectLayerResourceType(error);
        return {
          run: async (): Promise<never> => {
            throw error;
          },
        };
      },
    );
  }
}

function isVectorDrawableConversionError(error: Error): boolean {
  const cause = error.cause;
  return cause instanceof Error && cause.stack?.includes("svg2vectordrawable") === true;
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve: once(resolve),
    reject: once(reject),
  };
}

function once<T, Args extends unknown[]>(fn: (...args: Args) => T): (...args: Args) => T {
  let hasRun = false;
  let result!: T;

  return (...args: Args): T => {
    if (hasRun) {
      return result;
    }
    hasRun = true;
    result = fn(...args);
    return result;
  };
}
