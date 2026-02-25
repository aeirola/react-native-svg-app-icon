// Based on reference images from image asset studio

/**
 * SVG filter for the drop shadow effect.
 *
 * @param scalingRatio
 * @returns
 */
export const dropShadowFilter = `
<filter id="dropShadowFilter">
	<!-- Shift input image to shadow location -->
	<feOffset dx="0" dy="1.1" />
	<!-- Blur input to create shadow effect -->
	<feGaussianBlur stdDeviation="0.7" result="blur" />

	<!-- Apply shadow color and opacity -->
	<feFlood result="floodFill" flood-color="#050505" flood-opacity="0.2" />
	<feComposite in="blur" in2="floodFill" operator="in" />
</filter>`;

/**
 * SVG filter for the shaded edge effect around the icons.
 *
 * @param scalingRatio
 * @returns
 */
export const shadedEdgeFilter = `
<filter id="shadedEdgeFilter">
	<!-- Blur input to create shaded edge effect -->
	<feGaussianBlur stdDeviation="0.5" result="blur" />
	<!-- Apply shaded edge opacity -->
	<feFlood result="floodFill" flood-opacity="0.2" />

	<!-- Cut out content area to produce edge shade effect -->
	<feComposite in="blur" in2="floodFill" operator="in" result="opaque-alpha" />
	<feOffset dx="-0.25" dy="-0.3" in="SourceAlpha" result="offset-alpha" />
	<feComposite in="opaque-alpha" in2="offset-alpha" operator="out" />
</filter>`;
