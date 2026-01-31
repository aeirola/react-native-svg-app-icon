/**
 * Like Partial<T>, but also allows properties to be explicitly undefined.
 */
export type Optional<T> = {
	[P in keyof T]?: T[P] | undefined;
};
