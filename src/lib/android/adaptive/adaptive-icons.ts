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
import { convertToVectorDrawable, generateVectorDrawable } from "./vector-drawable";
import type { Context } from "../../util/context";
import type { ResolvedConfig } from "../config";
import type { Task } from "../../tasks";

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
  const backgroundDrawableResultPromise = convertToVectorDrawable(backgroundImageInput).then(
    (drawable) => ({ drawable }),
    (error: unknown) => ({ error }),
  );
  const foregroundDrawableResultPromise = convertToVectorDrawable(foregroundImageInput).then(
    (drawable) => ({ drawable }),
    (error: unknown) => ({ error }),
  );

  let backgroundResourceType: ResourceType;
  const backgroundDrawableResult = await backgroundDrawableResultPromise;
  if ("drawable" in backgroundDrawableResult) {
    yield* generateVectorDrawable(
      backgroundImageInput,
      launcherBackgroundName,
      context,
      backgroundDrawableResult.drawable,
    );
    backgroundResourceType = "drawable";
  } else {
    const error = backgroundDrawableResult.error;
    context.logger?.warn(
      `Vector drawable conversion failed for background, falling back to PNG: ${error instanceof Error ? error.message : String(error)}`,
    );
    yield* generateAdaptiveIconLayerPng(backgroundImageInput, launcherBackgroundName, context);
    backgroundResourceType = "mipmap";
  }

  let foregroundResourceType: ResourceType;
  const foregroundDrawableResult = await foregroundDrawableResultPromise;
  if ("drawable" in foregroundDrawableResult) {
    yield* generateVectorDrawable(
      foregroundImageInput,
      launcherForegroundName,
      context,
      foregroundDrawableResult.drawable,
    );
    foregroundResourceType = "drawable";
  } else {
    const error = foregroundDrawableResult.error;
    context.logger?.warn(
      `Vector drawable conversion failed for foreground, falling back to PNG: ${error instanceof Error ? error.message : String(error)}`,
    );
    yield* generateAdaptiveIconLayerPng(foregroundImageInput, launcherForegroundName, context);
    foregroundResourceType = "mipmap";
  }

  // Adaptive icon
  yield* output.generateFile(
    getIconPath(
      context.config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${launcherName}.xml`,
    ),
    () => adaptiveIconContent(backgroundResourceType, foregroundResourceType),
    context,
  );
  yield* output.generateFile(
    getIconPath(
      context.config,
      "mipmap",
      { density: "anydpi", minApiLevel: 26 },
      `${roundIconName}.xml`,
    ),
    () => adaptiveIconContent(backgroundResourceType, foregroundResourceType),
    context,
  );
}

async function* generateAdaptiveIconLayerPng(
  imageInput: input.Input<input.ImageData>,
  fileName: string,
  context: Context<ResolvedConfig>,
): AsyncIterable<Task> {
  yield* output.generatePngs(
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
  );
}
