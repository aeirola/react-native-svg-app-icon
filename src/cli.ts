#!/usr/bin/env node
import * as fse from "fs-extra";

import * as reactNativeSvgAppIcon from "./index";

const layerBackgroundPath = "./icon-layer-background.svg";
const layerForegroundPath = "./icon-layer-foreground.svg";
const defaultBackgroundPath = "./icon-background.svg";
const defaultForegroundPath = "./icon.svg";

/** Adds the string before the given char position. */
function addStringAtPos(original: string, add: string, position: number) {
  return original.substring(0, position) + add + original.substring(position);
}

function splitIconLayers() {
  const iconContent = fse.readFileSync(defaultForegroundPath, "utf-8");

  const _foreCloseTagMatch = /(?<=label="_fore"[\s\S]*)(>)/gm.exec(iconContent);
  if (!_foreCloseTagMatch) {
    throw new Error("_fore layer not found");
  }
  const _foreClosingTagPos = _foreCloseTagMatch.index;
  // Hide the front layer in background file
  const backgroundContent = addStringAtPos(
    iconContent,
    ' style="display:none"',
    _foreClosingTagPos
  );

  const _backCloseTagMatch = /(?<=label="_back"[\s\S]*)(>)/gm.exec(iconContent);
  if (!_backCloseTagMatch) {
    throw new Error("_back layer not found");
  }
  const _backClosingTagPos = _backCloseTagMatch.index;
  // Hide the back layer in foreground file
  const foregroundContent = addStringAtPos(
    iconContent,
    ' style="display:none"',
    _backClosingTagPos
  );

  fse.writeFileSync(layerBackgroundPath, backgroundContent);
  fse.writeFileSync(layerForegroundPath, foregroundContent);

  console.log("Created both layer files");
}

function deleteLayersFiles() {
  if (fse.existsSync(layerBackgroundPath)) fse.unlinkSync(layerBackgroundPath);
  if (fse.existsSync(layerForegroundPath)) fse.unlinkSync(layerForegroundPath);
}

async function main(): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  let backgroundPath = defaultBackgroundPath;
  let foregroundPath = defaultForegroundPath;

  const argvs = process.argv.slice(2);
  const usingLayers = argvs.includes("--layers");
  const keepLayerFiles = argvs.includes("--keepLayers");
  const dontCreateIcons = argvs.includes("--dontCreate");

  try {
    if (usingLayers) {
      console.log(
        "Using --layers argument. It is a experimental feature and will probably only work on Inkscape svg's.",
        "\r\nGetting _fore and _back from icon.svg and creating the temporary files"
      );
      splitIconLayers();
      backgroundPath = layerBackgroundPath;
      foregroundPath = layerForegroundPath;
    }

    if (!dontCreateIcons) {
      const generatedFiles = await reactNativeSvgAppIcon.generate({
        icon: {
          backgroundPath: (await fse.pathExists(backgroundPath))
            ? backgroundPath
            : undefined,
          foregroundPath: foregroundPath
        }
      });

      for await (const file of generatedFiles) {
        console.log("Wrote " + file);
      }
    }
    console.log("Done");
  } finally {
    if (usingLayers) {
      if (!keepLayerFiles) deleteLayersFiles();
    }
  }
}

if (require.main === module) {
  void main();
}

export default main;
