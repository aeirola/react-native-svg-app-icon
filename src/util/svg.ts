import { optimize } from "svgo";

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
	const { data: strippedSvg } = optimize(originalSvg, {
		plugins: ["removeDoctype", "removeXMLProcInst"],
	});

	// Create outer SVG with cropped viewBox - the nested SVG will be clipped
	// to show only the center region defined by the viewBox
	const wrappedSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${cropSize}" height="${cropSize}" viewBox="${offset} ${offset} ${cropSize} ${cropSize}">
  ${strippedSvg}
</svg>`;

	return Buffer.from(wrappedSvg, "utf-8");
}
