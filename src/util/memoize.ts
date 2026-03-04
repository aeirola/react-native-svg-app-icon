/**
 * Wraps a zero-argument function so that it is only called once.
 * Subsequent calls return the cached result from the first invocation.
 *
 * @param fn - The function to memoize. Must accept no arguments.
 * @returns A new function that calls `fn` on the first invocation and returns
 *   the cached result on every subsequent call.
 *
 * @example
 * const expensiveComputation = memoize(() => computeSomethingExpensive());
 * expensiveComputation(); // runs `computeSomethingExpensive`
 * expensiveComputation(); // returns cached result, does not re-run
 */
export function memoize<T>(fn: () => T): () => T {
	let cached: { value: T } | undefined;
	return (): T => {
		if (!cached) {
			cached = { value: fn() };
		}
		return cached.value;
	};
}
