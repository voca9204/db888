"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = void 0;
/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000, maxDelay = 10000) => {
    let retries = 0;
    let lastError;
    while (retries < maxRetries) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            retries++;
            if (retries >= maxRetries) {
                break;
            }
            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(initialDelay * Math.pow(2, retries - 1) + Math.random() * 1000, maxDelay);
            console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};
exports.retryWithBackoff = retryWithBackoff;
//# sourceMappingURL=retry.js.map