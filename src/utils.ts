/**
 * A higher-order function that adds retry logic to an async function.
 * @param fn The async function to execute.
 * @param retries The number of times to retry on failure.
 * @returns The result of the async function.
 */
export const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      const isRateLimitError = error.toString().toLowerCase().includes('rate limit') || (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('resource has been exhausted')));
      const delay = isRateLimitError ? 70000 : 2000; // 70s for rate limit, 2s for others

      if (isRateLimitError) {
        console.warn(`[Vibe] Rate limit detected. Waiting ${delay / 1000}s before retrying... (${retries} retries left)`);
      } else {
        console.warn(`[Vibe] Request failed. Retrying in ${delay / 1000}s... (${retries} retries left)`, error.message);
      }
      
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
};