import { optimize } from "svgo";

/**
 * Prepares an SVG buffer for inlining by stripping XML headers and prefixing
 * IDs to avoid collisions when multiple SVGs are inlined together.
 *
 * @param svgBuffer The SVG buffer to prepare.
 * @param idPrefix The prefix to use for IDs within the SVG.
 * @returns The inlinable SVG as a string.
 */
export function prepareForInlining(svgBuffer: Buffer, idPrefix: string): string {
  try {
    const svgoResult = optimize(svgBuffer.toString("utf-8"), {
      plugins: [
        "removeDoctype",
        "removeXMLProcInst",
        {
          name: "prefixIds",
          params: { prefix: idPrefix },
        },
      ],
    });

    return svgoResult.data;
  } catch (error) {
    throw new Error(
      `Parsing SVG failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
