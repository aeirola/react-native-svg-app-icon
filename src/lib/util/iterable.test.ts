import { describe, expect, it } from "vitest";
import { collectConcurrent } from "./iterable";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

/** Returns a promise that can be resolved manually from outside. */
function makeDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/**
 * Waits until all currently queued microtasks have fully drained.
 *
 * `setImmediate` is scheduled after the current event-loop tick, by which
 * point every pending microtask chain (including multi-hop `.then` chains
 * triggered by a promise resolution) will have completed.
 */
async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

/**
 * Builds a generator that yields lazy tasks (thunks). `startOrder` is updated
 * synchronously when the generator advances — i.e., when collectConcurrent
 * calls `next()` on the iterator, before the task is invoked.
 */
async function* makeTrackingIterator(
  count: number,
  startOrder: number[],
  makePromise: (i: number) => Promise<number> = (i) => Promise.resolve(i),
): AsyncIterable<() => Promise<number>> {
  for (let i = 0; i < count; i++) {
    startOrder.push(i);
    yield () => makePromise(i);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("collectConcurrent", () => {
  // -------------------------------------------------------------------------
  // Output completeness
  // -------------------------------------------------------------------------

  describe("collects all values", () => {
    it("returns empty array for empty input", async () => {
      async function* empty(): AsyncIterable<() => Promise<never>> {}
      expect(await collectConcurrent(empty(), 2)).toEqual([]);
    });

    it("collects all values when items are fewer than the concurrency limit", async () => {
      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (const v of [1, 2, 3]) yield () => Promise.resolve(v);
      }
      expect(await collectConcurrent(iter(), 5)).toEqual([1, 2, 3]);
    });

    it("collects all values when items equal the concurrency limit", async () => {
      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (const v of [1, 2, 3, 4]) yield () => Promise.resolve(v);
      }
      expect(await collectConcurrent(iter(), 4)).toEqual([1, 2, 3, 4]);
    });

    it("collects all values when items exceed the concurrency limit", async () => {
      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (const v of [1, 2, 3, 4, 5, 6]) yield () => Promise.resolve(v);
      }
      expect(await collectConcurrent(iter(), 2)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("returns values in input order", async () => {
      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (const v of [1, 2, 3]) yield () => Promise.resolve(v);
      }
      expect(await collectConcurrent(iter(), 3)).toEqual([1, 2, 3]);
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe("error handling", () => {
    it("rejects when a task rejects", async () => {
      const error = new Error("task failed");
      async function* iter(): AsyncIterable<() => Promise<number>> {
        yield () => Promise.resolve(1);
        yield () => Promise.reject(error);
        yield () => Promise.resolve(3);
      }
      await expect(collectConcurrent(iter(), 2)).rejects.toThrow(error);
    });

    it("rejects when a task rejects within the concurrency window", async () => {
      const error = new Error("task failed");
      async function* iter(): AsyncIterable<() => Promise<number>> {
        yield () => Promise.reject(error);
        yield () => Promise.resolve(2);
      }
      await expect(collectConcurrent(iter(), 4)).rejects.toThrow(error);
    });

    it("rejects when the iterator itself throws", async () => {
      const error = new Error("iterator failed");
      async function* iter(): AsyncIterable<() => Promise<number>> {
        yield () => Promise.resolve(1);
        throw error;
      }
      await expect(collectConcurrent(iter(), 2)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // Concurrency limiting
  // -------------------------------------------------------------------------

  describe("concurrency limiting", () => {
    it("never exceeds the concurrency limit when items exceed the limit", async () => {
      const limit = 3;
      let inFlight = 0;
      let peak = 0;

      // Promise executor runs synchronously on each it.next() call, so
      // inFlight++ is counted at the exact moment the slot is consumed.
      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (let i = 0; i < 9; i++) {
          yield () =>
            new Promise<number>((resolve) => {
              inFlight++;
              peak = Math.max(peak, inFlight);
              setTimeout(() => {
                inFlight--;
                resolve(i);
              }, 0);
            });
        }
      }

      await collectConcurrent(iter(), limit);

      expect(peak).toBeLessThanOrEqual(limit);
      // Also verify that parallelism actually reached the full limit.
      expect(peak).toBe(limit);
    });

    it("never exceeds the concurrency limit when items are fewer than the limit", async () => {
      const limit = 5;
      let inFlight = 0;
      let peak = 0;

      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (let i = 0; i < 3; i++) {
          yield () =>
            new Promise<number>((resolve) => {
              inFlight++;
              peak = Math.max(peak, inFlight);
              setTimeout(() => {
                inFlight--;
                resolve(i);
              }, 0);
            });
        }
      }

      await collectConcurrent(iter(), limit);

      // All 3 items run concurrently since the limit is not reached.
      expect(peak).toBeLessThanOrEqual(limit);
      expect(peak).toBe(3);
    });

    it("never exceeds the concurrency limit when items equal the limit", async () => {
      const limit = 4;
      let inFlight = 0;
      let peak = 0;

      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (let i = 0; i < 4; i++) {
          yield () =>
            new Promise<number>((resolve) => {
              inFlight++;
              peak = Math.max(peak, inFlight);
              setTimeout(() => {
                inFlight--;
                resolve(i);
              }, 0);
            });
        }
      }

      await collectConcurrent(iter(), limit);

      expect(peak).toBeLessThanOrEqual(limit);
      expect(peak).toBe(limit);
    });

    it("does not start the next item until a slot becomes available", async () => {
      // Use manually-controlled deferred promises so we can inspect state
      // between resolutions without relying on real timing.
      const started: number[] = [];
      const deferreds = Array.from({ length: 4 }, () => makeDeferred<number>());

      async function* iter(): AsyncIterable<() => Promise<number>> {
        for (let i = 0; i < 4; i++) {
          // startOrder.push happens synchronously when collectConcurrent calls it.next()
          started.push(i);
          yield () => deferreds[i]!.promise;
        }
      }

      const resultPromise = collectConcurrent(iter(), 2);

      // After starting collection, collectConcurrent fills the pool synchronously
      // then suspends at await Promise.race. Items 0 and 1 are started; 2
      // and 3 have not been touched yet.
      await flushMicrotasks();
      expect(started).toEqual([0, 1]);

      // Resolve item 0 — a slot opens up and item 2 should be started.
      deferreds[0]!.resolve(0);
      await flushMicrotasks();
      expect(started).toEqual([0, 1, 2]);

      // Item 3 must still not have started (only one slot was freed).
      expect(started).not.toContain(3);

      // Resolve item 1 — another slot opens and item 3 should start.
      deferreds[1]!.resolve(1);
      await flushMicrotasks();
      expect(started).toEqual([0, 1, 2, 3]);

      // Clean up: resolve remaining items and confirm all values are collected.
      deferreds[2]!.resolve(2);
      deferreds[3]!.resolve(3);
      expect(await resultPromise).toEqual([0, 1, 2, 3]);
    });
  });

  // -------------------------------------------------------------------------
  // Initialization order
  // -------------------------------------------------------------------------

  describe("initialization order", () => {
    it("starts items in input order when items exceed the concurrency limit", async () => {
      // startOrder records the sequence of it.next() calls (synchronous in
      // the generator executor), so any reordering would show up here.
      const startOrder: number[] = [];
      await collectConcurrent(makeTrackingIterator(6, startOrder), 2);
      expect(startOrder).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("starts items in input order when items equal the concurrency limit", async () => {
      const startOrder: number[] = [];
      await collectConcurrent(makeTrackingIterator(4, startOrder), 4);
      expect(startOrder).toEqual([0, 1, 2, 3]);
    });

    it("starts items in input order when items are fewer than the concurrency limit", async () => {
      const startOrder: number[] = [];
      await collectConcurrent(makeTrackingIterator(3, startOrder), 5);
      expect(startOrder).toEqual([0, 1, 2]);
    });

    it("starts exactly the first concurrency items before any result is produced", async () => {
      // Items use deferred promises so nothing resolves until we say so.
      // This lets us confirm that the first `concurrency` items — and only
      // those — are started during the initial synchronous fill of the pool.
      const concurrency = 3;
      const startOrder: number[] = [];
      const deferreds = Array.from({ length: 6 }, () => makeDeferred<number>());

      const resultPromise = collectConcurrent(
        makeTrackingIterator(6, startOrder, (i) => deferreds[i]!.promise),
        concurrency,
      );

      await flushMicrotasks();

      // Exactly `concurrency` items started; nothing beyond the window.
      expect(startOrder).toEqual([0, 1, 2]);

      // Resolve all to let the test finish cleanly.
      for (const [i, d] of deferreds.entries()) d!.resolve(i);
      await resultPromise;
    });
  });
});
