import { optimize } from "svgo";
import * as input from "./input";

/**
 * ViewBox for final SVG image. This is the same as the input foreground and
 * background images.
 *
 * Images, masks and effects are composed in the 108x108 scale so that the
 * source images can be used as is.
 */
export const viewBox = [0, 0, input.inputImageSize, input.inputImageSize].join(
	" ",
);

/**
 * Prepares an SVG buffer for inlining by stripping XML headers and prefixing
 * IDs to avoid collisions when multiple SVGs are inlined together.
 *
 * @param svgBuffer The SVG buffer to prepare.
 * @param idPrefix The prefix to use for IDs within the SVG.
 * @returns The inlinable SVG as a string.
 */
export function prepareForInlining(
	svgBuffer: Buffer,
	idPrefix: string,
): string {
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

	if (svgoResult.error !== undefined) {
		throw new Error(`Parsing SVG failed: ${svgoResult.error}`);
	}

	return svgoResult.data;
}

/**
 * Crops an SVG to a centered region.
 *
 * Implementation: Wraps the SVG with an outer SVG element that uses viewport/viewBox
 * semantics to define the visible crop region. This preserves the original SVG content
 * completely untouched.
 *
 * @param svgBuffer The original SVG content
 * @param fullSize The full size of the original SVG (e.g., 108)
 * @param cropSize The desired crop size (e.g., 72 for iOS icons)
 * @returns A cropped SVG buffer
 */
export function cropSvg(
	svgBuffer: Buffer,
	fullSize: number,
	cropSize: number,
): Buffer {
	const offset = (fullSize - cropSize) / 2;
	const originalSvg = svgBuffer.toString("utf-8");

	// Strip XML declaration and DOCTYPE which cannot appear in nested content
	const svgoResult = optimize(originalSvg, {
		plugins: ["removeDoctype", "removeXMLProcInst"],
	});

	if (svgoResult.error !== undefined) {
		throw new Error(`Parsing SVG failed: ${svgoResult.error}`);
	}
	const strippedSvg = svgoResult.data;

	// Create outer SVG with cropped viewBox - the nested SVG will be clipped
	// to show only the center region defined by the viewBox
	const wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cropSize}" height="${cropSize}" viewBox="${offset} ${offset} ${cropSize} ${cropSize}">
  ${strippedSvg}
</svg>`;

	/* Note: One might consider implementing the cropping by altering the viewBox
	 * of the original SVG directly, but that will change the relative size of
	 * any properties ussing viewport units (e.g., stroke-width="1vw") and thus
	 * alter the visual appearance of the SVG. */

	return Buffer.from(wrappedSvg, "utf-8");
}
