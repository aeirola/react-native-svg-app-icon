import type { Logger } from "./util/logger";

export interface Task {
  run(): Promise<string | undefined>;
}

export interface RunTasksOptions {
  concurrency?: number;
  logger?: Logger | undefined;
}

interface SettledTaskResult {
  self: Promise<SettledTaskResult>;
  index: number;
  filePath?: string | undefined;
  error?: Error;
}

const defaultConcurrency = 4;

export async function runTasks(
  taskIterable: AsyncIterable<Task>,
  { concurrency = defaultConcurrency, logger }: RunTasksOptions = {},
): Promise<string[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Invalid concurrency value: ${concurrency}. Expected an integer >= 1.`);
  }

  const taskIterator = taskIterable[Symbol.asyncIterator]();
  const seenFilePaths = new Set<string>();
  const taskFilePaths: Array<string | undefined> = [];
  const inFlight = new Set<Promise<SettledTaskResult>>();
  let nextIndex = 0;

  let isDone = false;
  let firstError: Error | undefined;

  while (!isDone && firstError === undefined) {
    while (!isDone && firstError === undefined && inFlight.size < concurrency) {
      let nextTask: IteratorResult<Task>;
      try {
        nextTask = await taskIterator.next();
      } catch (error) {
        firstError = toError(error);
        break;
      }

      if (nextTask.done) {
        isDone = true;
        break;
      }

      const index = nextIndex++;
      inFlight.add(tagTaskResult(nextTask.value, index, logger));
    }

    if (inFlight.size === 0) {
      break;
    }

    const settledResult = await Promise.race(inFlight);
    inFlight.delete(settledResult.self);
    if (settledResult.error !== undefined) {
      firstError ??= settledResult.error;
    } else {
      if (settledResult.filePath !== undefined) {
        if (seenFilePaths.has(settledResult.filePath)) {
          firstError = new Error(`duplicate output file path: ${settledResult.filePath}`);
          logger?.error(firstError.message);
        } else {
          seenFilePaths.add(settledResult.filePath);
          taskFilePaths[settledResult.index] = settledResult.filePath;
          logger?.info(`Wrote ${settledResult.filePath}`);
        }
      }
    }
  }

  if (firstError !== undefined) {
    await taskIterator.return?.();
  }

  while (inFlight.size > 0) {
    const settledResult = await Promise.race(inFlight);
    inFlight.delete(settledResult.self);
    if (settledResult.error !== undefined) {
      firstError ??= settledResult.error;
    } else {
      if (settledResult.filePath !== undefined) {
        if (seenFilePaths.has(settledResult.filePath)) {
          firstError ??= new Error(`duplicate output file path: ${settledResult.filePath}`);
          logger?.error(`duplicate output file path: ${settledResult.filePath}`);
        } else {
          seenFilePaths.add(settledResult.filePath);
          taskFilePaths[settledResult.index] = settledResult.filePath;
          logger?.info(`Wrote ${settledResult.filePath}`);
        }
      }
    }
  }

  if (firstError !== undefined) {
    throw firstError;
  }

  return taskFilePaths.filter((filePath): filePath is string => filePath !== undefined);
}

export function withTaskFallback(task: Task, fallbackTask: (error: Error) => Task): Task {
  return {
    run: async (): Promise<string | undefined> => {
      try {
        return await task.run();
      } catch (error) {
        return await fallbackTask(toError(error)).run();
      }
    },
  };
}

function tagTaskResult(
  task: Task,
  index: number,
  logger: Logger | undefined,
): Promise<SettledTaskResult> {
  const taskPromise = task.run();

  const taggedPromise: Promise<SettledTaskResult> = taskPromise.then(
    (filePath): SettledTaskResult =>
      filePath === undefined
        ? { self: taggedPromise, index }
        : { self: taggedPromise, filePath, index },
    (error): SettledTaskResult => ({
      self: taggedPromise,
      index,
      error: toError(error),
    }),
  );
  void taggedPromise.then((result) => {
    if (result.error !== undefined) {
      logger?.error(result.error.message);
    }
  });
  return taggedPromise;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
