/** Like Partial, but allows undefined values in addition to missing values */
export type Optional<T> = {
	[P in keyof T]?: T[P] | undefined;
};
