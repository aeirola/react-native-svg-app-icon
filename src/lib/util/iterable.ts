/**
 * Runs an async iterable of tasks with bounded concurrency, collecting all
 * resolved values into an array in the same order as the input iterable.
 *
 * Tasks are started in iteration order. At most `concurrency` tasks are
 * in-flight at any time. Results are assembled in input order regardless of
 * which tasks settle first.
 *
 * @param taskIterable - Async iterable producing tasks. Each yielded function is called
 *   immediately to start one operation; tasks are started in iteration order
 *   with at most `concurrency` active at a time.
 * @param concurrency - Maximum number of concurrent in-flight promises.
 *
 * @see https://stackoverflow.com/a/79247079 (CC BY-SA 4.0)
 *
 * @example
 * async function generateFiles(paths: string[]): Promise<string[]> {
 *   return collectConcurrent(
 *     (async function* () {
 *       for (const p of paths) yield () => writeFile(p);
 *     })(),
 *     4,
 *   );
 * }
 */
export async function collectConcurrent<T>(
  taskIterable: AsyncIterable<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const pool = new Set<Promise<Tagged<T>>>();
  const results: T[] = [];
  let nextIndex = 0;

  // Sliding window: fill up to `concurrency` slots, then drain one before
  // pulling the next item, keeping exactly `concurrency` in-flight.
  for await (const task of taskIterable) {
    pool.add(tag(task(), nextIndex++));

    if (pool.size >= concurrency) {
      const { self, index: valueIndex, value } = await Promise.race(pool);
      pool.delete(self);
      results[valueIndex] = value;
    }
  }

  while (pool.size > 0) {
    const { self, index: valueIndex, value } = await Promise.race(pool);
    pool.delete(self);
    results[valueIndex] = value;
  }

  return results;
}

/**
 * Wraps a resolved value together with the identity of its tagged promise so
 * that `Promise.race` can return both the value and the key needed to remove
 * the winner from the pool — without a side-effecting `.then` clean-up that
 * could race against the pool state when multiple promises resolve in the same
 * microtask turn.
 */
interface Tagged<T> {
  self: Promise<Tagged<T>>;
  index: number;
  value: T;
}

function tag<T>(p: Promise<T>, index: number): Promise<Tagged<T>> {
  const tagged: Promise<Tagged<T>> = p.then((value): Tagged<T> => ({ self: tagged, index, value }));
  return tagged;
}
