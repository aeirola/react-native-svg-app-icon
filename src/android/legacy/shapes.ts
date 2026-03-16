/**
 * SVG Shapes for android legacy icons.
 *
 * All dimensions are specified in the legacy 48x48dp coordinates.
 *
 * Based on reference images from image asset studio
 */

//
// Common values
//

/**
 * Size of the legacy icon content area in legacy icon sizing units (dp).
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/tags/studio-2025.3.1/android-npw/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#56
 */
export const legacyIconSize = 48;

/**
 * SVG viewbox that contains the legacy icon.
 */
export const legacyIconViewBox = `0 0 ${legacyIconSize} ${legacyIconSize}`;

//
// Square icon values
//

/**
 * Size of the square icon content area in legacy icon sizing units (dp).
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/tags/studio-2025.3.1/android-npw/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#303
 */
export const legacySquareIconContentSize = 38;

/** Transparent margin to include around the visible square icon content. */
const legacySquareIconMargin =
	(legacyIconSize - legacySquareIconContentSize) / 2;

/**
 * Corner radius of the square icon in legacy icon sizing units (dp).
 *
 * Design specifications define this value as 3, but Image Asset Studio seems to be closer to 2.9
 */
const legacySquareIconBorderRadius = 2.9;

/** SVG shape of the square icon. */
export const squareIconShape = `
<rect id="squareIconShape" x="${legacySquareIconMargin}" y="${legacySquareIconMargin}"
	width="${legacySquareIconContentSize}" height="${legacySquareIconContentSize}"
	rx="${legacySquareIconBorderRadius}" ry="${legacySquareIconBorderRadius}"
/>`;

/** SVG mask for the square icon. */
export const squareIconMask = `
<!-- SVG blur filter to soften mask edges. -->
<filter id="legacySquareIconMaskBlur">
	<feConvolveMatrix kernelMatrix="
		0.065 0 0.065
		0     1 0
		0.065 0 0.065" />
</filter>

<mask id="squareIconMask" mask-type="alpha">
	<use href="#squareIconShape" filter="url(#legacySquareIconMaskBlur)" />
</mask>`;

//
// Round icon values
//

/**
 * Size of the round icon content within legacy icon coordinates
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/tags/studio-2025.3.1/android-npw/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#298
 */
export const legacyRoundIconContentSize = 44;

/** Center of the icon, for circle centering. */
const legacyRoundIconCenter = legacyIconSize / 2;

/** SVG shape of the round icon. */
export const roundIconShape = `
<circle id="roundIconShape" cx="${legacyRoundIconCenter}" cy="${legacyRoundIconCenter}"
	r="${legacyRoundIconContentSize / 2}"
/>`;

/** SVG clip path for the round icon. */
export const roundIconClipPath = `
	<clipPath id="roundIconClipPath">
		<use href="#roundIconShape" />
	</clipPath>
`;
