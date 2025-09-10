import type OpenAI from 'openai';
import openai from './openaiClient';
import { callOpenAIWithValidation } from './openaiValidationUtil.js';
import { z } from 'zod';
import { generateTitleForPost } from './generateTitle';

// Sentiment analysis result type  
export type SentimentResult = {
    post: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
};

// Zod schema for sentiment validation
const SentimentSchema = z.object({
    sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"])
});

// Analyze multiple posts at once
export async function analyzeMultiplePosts(posts: string[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    const systemPrompt = `You are a sentiment analysis system for crypto-related posts.
Classify the sentiment of posts into one of: BULLISH, BEARISH, NEUTRAL.

Important: Always return the sentiment in uppercase letters exactly like this: BULLISH, BEARISH, NEUTRAL,
because our database stores them in uppercase.

Return only valid JSON in this format:
{
  "sentiment": "BULLISH"
}`;

    for (const post of posts) {
        try {
            const validated = await callOpenAIWithValidation({
                client: openai,
                systemPrompt,
                userPrompt: post,
                schema: SentimentSchema,
                retryCount: 3
            });

            if (validated) {
                results.push({ post, sentiment: validated.sentiment });
            }
        } catch (e) {
            console.error("Error analyzing post:", post, e);
            continue;
        }
    }
    return results;
}

async function runExample() {
    // Example runner
    const posts = [
        "Bitcoin is going to skyrocket after the halving!",
        "Ethereum might drop below $1000 soon, risky market.",
        "The market seems calm today, no major moves."
    ];

    const results = await analyzeMultiplePosts(posts);
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const sentiment = results[i]?.sentiment;
        const title = await generateTitleForPost(post);
        console.log(`Post: ${post}`);
        if (title) {
            console.log(`Title: ${title}`);
        }
        if (sentiment) {
            console.log(`Sentiment: ${sentiment}`);
        }
        console.log('─'.repeat(40));
    }
}

(async () => {
    await runExample();
})();