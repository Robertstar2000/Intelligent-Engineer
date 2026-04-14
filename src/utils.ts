
/**
 * A robust retry utility with exponential backoff and jitter.
 * Designed to handle transient API errors like rate limits and timeouts.
 * @param fn The async function to execute.
 * @param retries Number of retry attempts.
 * @param baseDelay Initial delay in ms.
 * @returns The result of the async function.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>, 
  retries = 4, 
  baseDelay = 2000
): Promise<T> => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isRateLimit = errorStr.includes('rate limit') || 
                          errorStr.includes('429') || 
                          errorStr.includes('resource_exhausted') ||
                          errorStr.includes('quota');
      const isTimeout = errorStr.includes('deadline exceeded') || 
                        errorStr.includes('504') || 
                        errorStr.includes('timeout');
      
      const isTransient = isRateLimit || isTimeout || errorStr.includes('internal error') || errorStr.includes('500');

      if (!isTransient || attempt === retries) {
        // If not a transient error, or we've exhausted retries, format a user-friendly error
        let friendlyMessage = "The AI service encountered an error.";
        if (isRateLimit) friendlyMessage = "Ai quota exceeded, wait 24 hours or replace key or use a paid Gemini key for bigger quota";
        if (isTimeout) friendlyMessage = "The request timed out. This often happens with complex documents. Retrying...";
        if (errorStr.includes('safety')) friendlyMessage = "The content was flagged by safety filters and could not be generated.";
        
        const enhancedError = new Error(friendlyMessage);
        (enhancedError as any).originalError = error;
        (enhancedError as any).isTransient = isTransient;
        throw enhancedError;
      }

      // Calculate exponential backoff: baseDelay * 2^attempt + jitter
      const delay = Math.min(
        isRateLimit ? 30000 : baseDelay * Math.pow(2, attempt), // 30s min for rate limits
        60000 // Max 1 minute
      ) + (Math.random() * 1000);
      
      console.warn(`[Vibe AI] Attempt ${attempt + 1} failed (${isRateLimit ? 'Rate Limit' : isTimeout ? 'Timeout' : 'Transient Error'}). Retrying in ${Math.round(delay/1000)}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  throw new Error("Maximum retry attempts reached. Please try again later.");
};
