import * as input from "../../util/input";

/**
 * ViewBox for final SVG image. This is the same as the input foreground and
 * background images.
 *
 * Images, masks and lightning effects are composed in the 108x108 scale so
 * that the source images can be used as is. Legacy icon sizing needs to be
 * scaled to this sizing.
 */
export const viewBox = [0, 0, input.inputImageSize, input.inputImageSize].join(
	" ",
);

/**
 * Size of the legacy icon content area in legacy icon sizing units (dp).
 *
 * @see https://android.googlesource.com/platform/tools/adt/idea/+/refs/heads/mirror-goog-studio-master-dev/android/src/com/android/tools/idea/npw/assetstudio/LauncherLegacyIconGenerator.java#55
 */
export const legacyIconBaseSize = 48;
