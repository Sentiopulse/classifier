import type OpenAI from 'openai';
import openai from './openaiClient.js';
import { callOpenAIWithValidation } from './openaiValidationUtil.js';
import { z } from 'zod';

// Title generation result type
export type TitleResult = {
    post: string;
    title: string;
};

// Zod schema for title validation
const TitleSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must not exceed 100 characters")
});

// Generate title for a single post
export async function generateTitleForPost(post: string, clientOverride?: OpenAI): Promise<string> {
    const usedClient: OpenAI = clientOverride ?? openai;

    const systemPrompt = `You are a title generation system for social media posts, particularly crypto and tech-related content.

Instructions:
1. Generate a concise, engaging title that captures the essence of the post
2. Keep titles between 5-100 characters
3. Make it catchy and relevant to the content
4. Focus on the key message or main topic
5. Return only valid JSON in this format:
{
  "title": "Your Generated Title Here"
}

Be strict: return only raw JSON with exactly that shape; no code fences or prose.`;

    try {
        const validated = await callOpenAIWithValidation({
            client: usedClient,
            systemPrompt,
            userPrompt: post,
            schema: TitleSchema,
            retryCount: 3
        });

        if (!validated?.title) {
            throw new Error(`Title generation failed for post: ${post}`);
        }
        return validated.title;
    } catch (e) {
        console.error("Error generating title for post:", post, e);
        throw e;
    }
}

// Generate titles for multiple posts
export async function generateTitlesForPosts(posts: string[]): Promise<TitleResult[]> {
    const results: TitleResult[] = [];

    for (const post of posts) {
        try {
            const title = await generateTitleForPost(post);
            if (title) {
                results.push({ post, title });
            }
        } catch (e) {
            console.error("Error generating title for post:", post, e);
            continue;
        }
    }

    return results;
}
