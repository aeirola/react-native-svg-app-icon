/** Data passed between the Android plugin functions, as Expo has no API for it. */
export interface Context {
  generatedFiles: string[];
  /** Absolute output path used by icon generation, set once generation has run. */
  outputPath: string | undefined;
}
