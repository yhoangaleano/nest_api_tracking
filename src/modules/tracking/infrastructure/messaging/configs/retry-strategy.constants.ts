/**
 * Maximum number of retry attempts for failed checkpoint processing
 */
export const MAX_RETRIES_CONSTANT = 3;

/**
 * Exponential backoff delays in milliseconds for each retry attempt
 * [1st retry: 1s, 2nd retry: 5s, 3rd retry: 15s]
 */
export const RETRY_DELAYS_MS_CONSTANT = [1000, 5000, 15000];

/**
 * Default delay if retry count exceeds configured delays
 */
export const DEFAULT_RETRY_DELAY_MS_CONSTANT = 15000;
