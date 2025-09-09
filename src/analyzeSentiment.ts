import type OpenAI from 'openai';
import openai from './openaiClient';

// Sentiment analysis result type  
export type SentimentResult = {
    post: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
};

// Analyze multiple posts at once
export async function analyzeMultiplePosts(posts: string[], clientOverride?: OpenAI): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    for (const post of posts) {
        try {
            const usedClient = clientOverride ?? openai;

            // System prompt for instructions, user prompt for content
            const systemPrompt = `You are a sentiment analysis system for crypto-related posts.
Classify the sentiment of posts into one of: BULLISH, BEARISH, NEUTRAL.

Important: Always return the sentiment in uppercase letters exactly like this: BULLISH, BEARISH, NEUTRAL,
because our database stores them in uppercase.

Return only valid JSON in this format:
{
  "sentiment": "BULLISH"
}`;

            let lastResponse = "";
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                attempts++;

                const messages: Array<{ role: "system" | "user"; content: string }> = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: post }
                ];

                // Add feedback about previous failed attempt
                if (attempts > 1) {
                    messages.push({
                        role: "user",
                        content: `Your previous response was invalid: "${lastResponse}". Please provide only valid JSON with the exact format specified.`
                    });
                }

                const response = await usedClient.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages,
                });

                const content = response.choices?.[0]?.message?.content;
                if (!content) {
                    lastResponse = "No content returned";
                    continue;
                }

                lastResponse = content.trim();

                try {
                    const parsedAny = JSON.parse(lastResponse) as { sentiment?: string };
                    const raw = (parsedAny.sentiment ?? '').toString().toUpperCase().trim();

                    if (!["BULLISH", "BEARISH", "NEUTRAL"].includes(raw)) {
                        lastResponse = `Invalid sentiment: ${parsedAny.sentiment}`;
                        continue;
                    }

                    results.push({ post, sentiment: raw as "BULLISH" | "BEARISH" | "NEUTRAL" });
                    break; // Success, exit retry loop
                } catch (parseError) {
                    if (attempts === maxAttempts) {
                        throw new Error(`Failed to get valid JSON after ${maxAttempts} attempts. Last response: ${lastResponse}`);
                    }
                    // Continue to next attempt with feedback
                }
            }
        } catch (e) {
            console.error("Error analyzing post:", post, e);
            continue;
        }
    }
    return results;
}

// Example runner
export async function runExample() {
    const posts = [
        "Bitcoin is going to skyrocket after the halving!",
        "Ethereum might drop below $1000 soon, risky market.",
        "The market seems calm today, no major moves."
    ];

    const results = await analyzeMultiplePosts(posts);
    console.log("Sentiment Analysis Results:", JSON.stringify(results, null, 2));
}
