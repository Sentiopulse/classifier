import type OpenAI from 'openai';
import openai from './openaiClient.js';
import { callOpenAIWithValidation } from './openaiValidationUtil.js';
import { z } from 'zod';
import { generateTitleForPost } from './generateTitle.js';

// Sentiment analysis result type
export type SentimentResult = {
  post: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
};

// Zod schema for sentiment validation
const SentimentSchema = z.object({
  sentiment: z.enum(['BULLISH', 'BEARISH', 'NEUTRAL'])
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
      console.error('Error analyzing post:', post, e);
      continue;
    }
  }
  return results;
}

async function runExample() {
  // Example runner
  const posts = [
    'Bitcoin is going to skyrocket after the halving event next month! The fundamentals are incredibly strong and institutional adoption is accelerating. This could be the start of the next major bull run that takes us to new all-time highs.',
    "Ethereum might drop below $1000 soon due to the current risky market conditions. The macro environment is deteriorating and there's too much leverage in the system. I'm expecting a significant correction in the coming weeks.",
    "The market seems calm today with no major moves in either direction. Bitcoin is trading sideways and most altcoins are following suit. It's a good time to accumulate quality projects at these levels."
  ];

  const results = await analyzeMultiplePosts(posts);
  const resultsByPost = new Map(results.map((r) => [r.post, r.sentiment]));
  for (const post of posts) {
    const sentiment = resultsByPost.get(post);
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

// Run example if this file is executed directly (not imported)
if (require.main === module) {
  runExample();
}
