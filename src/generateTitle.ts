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

// Sentiment summaries result type
export type SentimentSummaries = {
    bullishSummary: string;
    bearishSummary: string;
    neutralSummary: string;
};

// Zod schema for sentiment summaries validation
const SentimentSummariesSchema = z.object({
    bullishSummary: z.string().min(10, "Bullish summary must be at least 10 characters").max(500, "Bullish summary must not exceed 500 characters"),
    bearishSummary: z.string().min(10, "Bearish summary must be at least 10 characters").max(500, "Bearish summary must not exceed 500 characters"),
    neutralSummary: z.string().min(10, "Neutral summary must be at least 10 characters").max(500, "Neutral summary must not exceed 500 characters")
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

// Generate sentiment-based summaries for a group of posts
export async function generateSentimentSummariesForGroup(posts: any[], clientOverride?: OpenAI): Promise<SentimentSummaries> {
    const usedClient: OpenAI = clientOverride ?? openai;

    const systemPrompt = `You are a sentiment analysis and summary generation system for social media posts, particularly crypto and tech-related content.

Instructions:
1. Analyze the provided posts and their sentiments (BULLISH, BEARISH, NEUTRAL)
2. Generate three distinct summaries based on sentiment analysis:
   - bullishSummary: Summarize the key bullish points, optimistic outlook, and positive sentiment from the posts
   - bearishSummary: Summarize the key bearish points, concerns, and negative sentiment from the posts  
   - neutralSummary: Summarize the balanced, factual, or neutral observations from the posts
3. Each summary should be 10-500 characters
4. Focus on the main themes, key insights, and overall sentiment trends
5. Make summaries informative and actionable
6. Return only valid JSON in this format:
{
  "bullishSummary": "Your bullish summary here",
  "bearishSummary": "Your bearish summary here", 
  "neutralSummary": "Your neutral summary here"
}

Be strict: return only raw JSON with exactly that shape; no code fences or prose.`;

    const postsJson = JSON.stringify(posts);

    try {
        const validated = await callOpenAIWithValidation({
            client: usedClient,
            systemPrompt,
            userPrompt: postsJson,
            schema: SentimentSummariesSchema,
            retryCount: 3,
            maxTokens: 800
        });

        if (!validated?.bullishSummary || !validated?.bearishSummary || !validated?.neutralSummary) {
            throw new Error(`Sentiment summaries generation failed for posts.`);
        }
        return {
            bullishSummary: validated.bullishSummary,
            bearishSummary: validated.bearishSummary,
            neutralSummary: validated.neutralSummary
        };
    } catch (e) {
        console.error("Error generating sentiment summaries.", {
            postCount: Array.isArray(posts) ? posts.length : undefined,
            error: e instanceof Error ? e.message : String(e)
        });
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
