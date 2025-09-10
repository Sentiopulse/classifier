// Small shared utilities

export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with small jitter to avoid thundering herd
export const jitteredBackoff = (
    baseMs: number,
    attempt: number,
    jitterMs: number = 100
): number => baseMs * 2 ** (attempt - 1) + Math.floor(Math.random() * jitterMs);
