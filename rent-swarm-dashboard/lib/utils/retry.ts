/**
 * Exponential Backoff Retry Utility
 * Based on Google SRE best practices for handling cascading failures
 * https://sre.google/sre-book/addressing-cascading-failures/
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 32000, // 32 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  // Check for 429 Too Many Requests or other server errors
  if (error?.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  // Check error message for common patterns
  const errorMessage = error?.message || error?.toString() || '';

  // Google API specific error patterns
  if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
    return true;
  }

  if (errorMessage.includes('Resource exhausted')) {
    return true;
  }

  if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
    return true;
  }

  if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 * Jitter helps prevent thundering herd problem
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (random value between 0 and delay)
  // This prevents all clients from retrying at exactly the same time
  const jitter = Math.random() * cappedDelay;

  return Math.floor(jitter);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise with the result of fn
 *
 * @example
 * const result = await withRetry(
 *   async () => model.generateContent(prompt),
 *   {
 *     maxRetries: 5,
 *     initialDelayMs: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
 *     }
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableStatusCodes)) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );

      // Call retry callback if provided
      opts.onRetry(error, attempt + 1, delayMs);

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Create a retryable wrapper for a function
 * Useful for creating a reusable retryable version of a function
 *
 * @example
 * const retryableGenerate = createRetryable(
 *   (prompt: string) => model.generateContent(prompt),
 *   { maxRetries: 5 }
 * );
 * const result = await retryableGenerate("Hello");
 */
export function createRetryable<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options);
  };
}
