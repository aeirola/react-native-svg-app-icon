import type { Logger } from "./util/logger";

export interface Task {
  filePath: string;
  run(): Promise<void>;
}

export interface RunTasksOptions {
  concurrency?: number;
  logger?: Logger | undefined;
}

interface SettledTaskResult {
  self: Promise<SettledTaskResult>;
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
  const writtenFilePaths: string[] = [];
  const inFlight = new Set<Promise<SettledTaskResult>>();

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

      const task = nextTask.value;
      if (seenFilePaths.has(task.filePath)) {
        firstError = new Error(`duplicate output file path: ${task.filePath}`);
        logger?.error(firstError.message);
        break;
      }
      seenFilePaths.add(task.filePath);
      writtenFilePaths.push(task.filePath);
      inFlight.add(tagTaskResult(task, logger));
    }

    if (inFlight.size === 0) {
      break;
    }

    const settledResult = await Promise.race(inFlight);
    inFlight.delete(settledResult.self);
    if (settledResult.error !== undefined) {
      firstError ??= settledResult.error;
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
    }
  }

  if (firstError !== undefined) {
    throw firstError;
  }

  return writtenFilePaths;
}

function tagTaskResult(task: Task, logger: Logger | undefined): Promise<SettledTaskResult> {
  const taskPromise = task.run().catch((error: unknown) => {
    const writeError = toErrorWithFilePath(task.filePath, error);
    logger?.error(writeError.message);
    throw writeError;
  });

  const taggedPromise: Promise<SettledTaskResult> = taskPromise.then(
    (): SettledTaskResult => ({ self: taggedPromise }),
    (error): SettledTaskResult => ({ self: taggedPromise, error: toError(error) }),
  );
  return taggedPromise;
}

function toErrorWithFilePath(filePath: string, error: unknown): Error {
  const reason = error instanceof Error ? error.message : String(error);
  return new Error(`failed to write file ${filePath}: ${reason}`, {
    cause: error instanceof Error ? error : undefined,
  });
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
