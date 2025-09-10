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
            const parsed = JSON.parse(raw);
            return zodSchema.parse(parsed);
        } catch (err) {
            lastError = err;
            // Optionally, you can modify chatParams.messages to add feedback for retries
        }
    }
    console.error(`Failed after ${maxAttempts} attempts:`, lastError);
    return null;
}

