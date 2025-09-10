import type OpenAI from 'openai';
import type { ChatCompletionMessageParam } from "openai/resources";
import { ZodSchema } from 'zod';
import { sleep, jitteredBackoff } from './lib/utils.js';

/**
 * Calls OpenAI chat completion API and validates the response with a Zod schema, retrying up to maxAttempts times.
 * Returns the validated result or null if all attempts fail.
 */
export async function callOpenAIWithValidation<T>(params: {
    client: OpenAI,
    systemPrompt: string,
    userPrompt: string,
    schema: ZodSchema<T>,
    retryCount?: number
}): Promise<T> {
    let lastError: unknown = null;
    const baseDelayMs = 500;
    const maxAttempts = params.retryCount ?? 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt }
        ];

        // Add feedback about previous failed attempt
        if (attempt > 1 && lastError) {
            const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
            messages.push({
                role: "user",
                content: `Your previous response was invalid: "${errorMessage}". Please provide only valid JSON with the exact format specified.`
            });
        }

        const chatParams = {
            model: "gpt-4o-mini",
            messages,
            response_format: { type: "json_object" } as const,
            max_tokens: 200
        };
        try {
            const response = await params.client.chat.completions.create(chatParams);
            let raw: string | undefined;
            if ('choices' in response && Array.isArray(response.choices)) {
                const content = response.choices[0]?.message?.content;
                raw = typeof content === 'string' ? content : undefined;
            }
            if (!raw) throw new Error('No content returned from OpenAI');
            const parsed = JSON.parse(raw);
            return params.schema.parse(parsed);
        } catch (err) {
            lastError = err;
            const anyErr = err as any;
            const status = anyErr?.status || anyErr?.code || anyErr?.error?.code;
            const type = anyErr?.error?.type || anyErr?.type;
            const isRateLimit = status === 429 || type === 'rate_limit';
            const isServerError = typeof status === 'number' && status >= 500;
            const isQuota = type === 'insufficient_quota';
            if (isQuota) break;
            if ((isRateLimit || isServerError) && attempt < maxAttempts) {
                const delay = jitteredBackoff(baseDelayMs, attempt);
                console.warn(`OpenAI transient error (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            break;
        }
    }
    throw new Error(`OpenAI validation failed after ${maxAttempts} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

