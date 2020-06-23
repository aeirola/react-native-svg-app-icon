#!/usr/bin/env node
import * as fse from "fs-extra";

import * as reactNativeSvgAppIcon from "./index";

async function main(): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  const generatedFiles = await reactNativeSvgAppIcon.generate({
    icon: {
      backgroundPath: (await fse.pathExists("./icon-background.svg"))
        ? "./icon-background.svg"
        : undefined,
      foregroundPath: "./icon.svg"
    }
  });

  for await (const file of generatedFiles) {
    console.log("Wrote " + file);
  }
  console.log("Done");
}

if (require.main === module) {
  void main();
}

export default main;
