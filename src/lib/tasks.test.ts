import { type Task, runTasks } from "./tasks";
import { describe, expect, it } from "vitest";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function makeDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe("runTasks", () => {
  it("respects the concurrency limit", async () => {
    let inFlight = 0;
    let peakInFlight = 0;

    async function* tasks(): AsyncIterable<Task> {
      for (let i = 0; i < 8; i++) {
        const filePath = `file-${i}`;
        yield {
          filePath,
          run: async () => {
            inFlight++;
            peakInFlight = Math.max(peakInFlight, inFlight);
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            inFlight--;
          },
        };
      }
    }

    const filePaths = await runTasks(tasks(), { concurrency: 3 });
    expect(filePaths).toEqual([
      "file-0",
      "file-1",
      "file-2",
      "file-3",
      "file-4",
      "file-5",
      "file-6",
      "file-7",
    ]);
    expect(peakInFlight).toBe(3);
  });

  it("returns file paths in generator yield order", async () => {
    const first = makeDeferred<void>();
    const second = makeDeferred<void>();
    const third = makeDeferred<void>();

    const runPromise = runTasks(
      (async function* (): AsyncIterable<Task> {
        yield { filePath: "a", run: async () => first.promise };
        yield { filePath: "b", run: async () => second.promise };
        yield { filePath: "c", run: async () => third.promise };
      })(),
      { concurrency: 3 },
    );

    third.resolve();
    second.resolve();
    first.resolve();

    await expect(runPromise).resolves.toEqual(["a", "b", "c"]);
  });

  it("fails fast on duplicate file paths", async () => {
    let consumed = 0;
    const firstTask = makeDeferred<void>();

    const runPromise = runTasks(
      (async function* (): AsyncIterable<Task> {
        consumed++;
        yield { filePath: "duplicate.png", run: async () => firstTask.promise };
        consumed++;
        yield { filePath: "duplicate.png", run: async () => Promise.resolve() };
        consumed++;
        yield { filePath: "should-not-be-consumed.png", run: async () => Promise.resolve() };
      })(),
      { concurrency: 2 },
    );

    firstTask.resolve();
    await expect(runPromise).rejects.toThrow("duplicate output file path: duplicate.png");
    expect(consumed).toBe(2);
  });

  it("fails on first rejection with file path context", async () => {
    const runPromise = runTasks(
      (async function* (): AsyncIterable<Task> {
        yield {
          filePath: "/tmp/failed.png",
          run: async () => {
            throw new Error("boom");
          },
        };
      })(),
    );

    await expect(runPromise).rejects.toThrow("failed to write file /tmp/failed.png: boom");
  });

  it("stops consuming source generator after failure", async () => {
    let consumed = 0;

    const runPromise = runTasks(
      (async function* (): AsyncIterable<Task> {
        consumed++;
        yield {
          filePath: "first.png",
          run: async () => {
            throw new Error("first failure");
          },
        };
        consumed++;
        yield { filePath: "second.png", run: async () => Promise.resolve() };
      })(),
      { concurrency: 1 },
    );

    await expect(runPromise).rejects.toThrow("failed to write file first.png: first failure");
    expect(consumed).toBe(1);
  });

  it("waits for in-flight tasks to settle before rejecting", async () => {
    const slowTask = makeDeferred<void>();
    let slowSettled = false;
    let rejected = false;

    const runPromise = runTasks(
      (async function* (): AsyncIterable<Task> {
        yield {
          filePath: "fail-fast.png",
          run: async () => {
            throw new Error("failed early");
          },
        };
        yield {
          filePath: "in-flight.png",
          run: async () => {
            try {
              await slowTask.promise;
            } finally {
              slowSettled = true;
            }
          },
        };
      })(),
      { concurrency: 2 },
    ).catch((error) => {
      rejected = true;
      throw error;
    });

    await flushMicrotasks();
    expect(rejected).toBe(false);

    slowTask.resolve();

    await expect(runPromise).rejects.toThrow("failed to write file fail-fast.png: failed early");
    expect(slowSettled).toBe(true);
  });
});
