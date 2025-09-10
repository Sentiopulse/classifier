import type OpenAI from 'openai';
import { ZodSchema } from 'zod';

/**
 * Calls OpenAI chat completion API and validates the response with a Zod schema, retrying up to maxAttempts times.
 * Returns the validated result or null if all attempts fail.
 */
export async function callOpenAIWithValidation<T>(
    openaiClient: OpenAI,
    chatParams: Parameters<OpenAI['chat']['completions']['create']>[0],
    zodSchema: ZodSchema<T>,
    maxAttempts: number = 3
): Promise<T | null> {
    let lastError: unknown = null;
    const baseDelayMs = 500;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await openaiClient.chat.completions.create(chatParams);
            // Handle both streaming and non-streaming responses
            let raw: string | undefined;
            if ('choices' in response && Array.isArray(response.choices)) {
                const content = response.choices[0]?.message?.content;
                raw = typeof content === 'string' ? content : undefined;
            }
            if (!raw) throw new Error('No content returned from OpenAI');
            const parsed = JSON.parse(extractJson(raw));
            return zodSchema.parse(parsed);
        } catch (err) {
            lastError = err;
            // Retry only on transient OpenAI conditions
            const anyErr = err as any;
            const status = anyErr?.status || anyErr?.code || anyErr?.error?.code;
            const type = anyErr?.error?.type || anyErr?.type;
            const isRateLimit = status === 429 || type === 'rate_limit';
            const isServerError = typeof status === 'number' && status >= 500;
            const isQuota = type === 'insufficient_quota';
            if (isQuota) break; // non-retryable in our flow
            if ((isRateLimit || isServerError) && attempt < maxAttempts) {
                const delay = baseDelayMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
                console.warn(`OpenAI transient error (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            // Non-retryable: stop looping
            break;
        }
    }
    console.error(`Failed after ${maxAttempts} attempts:`, lastError);
    return null;
}

// Be tolerant to fenced blocks if upstream prompts ever allow them.
function extractJson(text: string): string {
    const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const m = fence.exec(text);
    return m ? m[1] : text.trim();
}

