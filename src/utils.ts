/**
 * A higher-order function that adds retry logic to an async function.
 * @param fn The async function to execute.
 * @param retries The number of times to retry on failure.
 * @returns The result of the async function.
 */
export const withRetry = async <T>(fn: () => Promise<T>, retries = 1): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};