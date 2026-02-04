import * as path from "node:path";

export type ResourceType = "mipmap" | "drawable";

export type ResourceDensity =
	| "ldpi"
	| "mdpi"
	| "hdpi"
	| "xhdpi"
	| "xxhdpi"
	| "xxxhdpi"
	| "anydpi";

export const densities: { name: ResourceDensity; scale: number }[] = [
	{ name: "mdpi", scale: 1 },
	{ name: "hdpi", scale: 1.5 },
	{ name: "xhdpi", scale: 2 },
	{ name: "xxhdpi", scale: 3 },
	{ name: "xxxhdpi", scale: 4 },
];

export const launcherName = "ic_launcher";
export const roundIconName = "ic_launcher_round";
export const launcherBackgroundName = "ic_launcher_background";
export const launcherForegroundName = "ic_launcher_foreground";

export function getIconPath(
	config: { androidOutputPath: string },
	resourceType: ResourceType,
	qualifier: {
		density: ResourceDensity;
		minApiLevel?: number;
	},
	fileName: string,
): string {
	let directoryName: string[] = [resourceType];
	if (qualifier.density) {
		directoryName = [...directoryName, qualifier.density];
	}

	if (qualifier.minApiLevel) {
		directoryName = [...directoryName, `v${qualifier.minApiLevel}`];
	}
	return path.join(config.androidOutputPath, directoryName.join("-"), fileName);
}
