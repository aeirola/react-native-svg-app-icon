import { describe, expect, it, vi } from "vitest";
import { memoize } from "./memoize";

describe("memoize", () => {
	it("returns the result of the wrapped function", () => {
		const memoized = memoize(() => 42);
		expect(memoized()).toBe(42);
	});

	it("calls the wrapped function only once across multiple invocations", () => {
		const fn = vi.fn(() => "result");
		const memoized = memoize(fn);

		memoized();
		memoized();
		memoized();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("returns the same cached value on every call", () => {
		const memoized = memoize(() => ({ id: 1 }));
		const first = memoized();
		const second = memoized();
		expect(first).toBe(second);
	});

	it("works when the wrapped function returns a falsy value", () => {
		const fn = vi.fn(() => 0);
		const memoized = memoize(fn);

		expect(memoized()).toBe(0);
		expect(memoized()).toBe(0);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
