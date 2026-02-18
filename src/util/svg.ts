import { optimize } from "svgo";

/**
 * Strips XML declaration and DOCTYPE from an SVG buffer, returning the cleaned SVG string.
 * This is necessary when embedding SVG content inside another SVG element, since XML
 * processing instructions and DOCTYPE declarations cannot appear in nested content.
 *
 * @param svgBuffer The original SVG content
 * @returns SVG string with XML headers removed
 */
export function stripSvgXmlHeaders(svgBuffer: Buffer): string {
	const svgoResult = optimize(svgBuffer.toString("utf-8"), {
		plugins: ["removeDoctype", "removeXMLProcInst"],
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
	const strippedSvg = stripSvgXmlHeaders(svgBuffer);

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
