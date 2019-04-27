#!/usr/bin/env node

import * as reactNativeSvgAppIcon from "./index";

async function main(): Promise<void> {
  console.log("Running react-native-svg-app-icon");

  const generatedFiles = await reactNativeSvgAppIcon.generate({
    icon: "./icon.svg"
  });

  for await (let file of generatedFiles) {
    console.log("Wrote " + file);
  }
  console.log("Done");
}

if (require.main === module) {
  main();
}

export default main;
