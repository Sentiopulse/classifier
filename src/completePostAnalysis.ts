import type OpenAI from 'openai';
import openai from './openaiClient';
import { categorizePost, type Categorization } from './classifyWithOpenAI';
import { analyzeMultiplePosts, type SentimentResult } from './analyzeSentiment';
import { generateTitleForPost, type TitleResult } from './generateTitle';

// Combined result type for complete post analysis
export type PostAnalysisResult = {
    post: string;
    title?: string;
    categorization?: Categorization;
    sentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
    errors?: string[];
};

// Process a single post with all analysis
export async function analyzeCompletePost(
    post: string,
    clientOverride?: OpenAI
): Promise<PostAnalysisResult> {
    const usedClient: OpenAI = clientOverride ?? openai;
    const result: PostAnalysisResult = { post, errors: [] };

    // Generate title
    try {
        const title = await generateTitleForPost(post, usedClient);
        if (title) {
            result.title = title;
        }
    } catch (e) {
        result.errors?.push(`Title generation failed: ${e}`);
        console.error("Title generation error:", e);
    }

    // Categorize post
    try {
        const categorization = await categorizePost(post, usedClient);
        if (categorization) {
            result.categorization = categorization;
        }
    } catch (e) {
        result.errors?.push(`Categorization failed: ${e}`);
        console.error("Categorization error:", e);
    }

    // Analyze sentiment
    try {
        const sentimentResults = await analyzeMultiplePosts([post]);
        if (sentimentResults.length > 0) {
            result.sentiment = sentimentResults[0].sentiment;
        }
    } catch (e) {
        result.errors?.push(`Sentiment analysis failed: ${e}`);
        console.error("Sentiment analysis error:", e);
    }

    return result;
}

// Process multiple posts with all analysis
export async function analyzeMultipleCompletePosts(
    posts: string[],
    clientOverride?: OpenAI
): Promise<PostAnalysisResult[]> {
    const results: PostAnalysisResult[] = [];

    for (const post of posts) {
        try {
            const analysis = await analyzeCompletePost(post, clientOverride);
            results.push(analysis);
        } catch (e) {
            console.error("Error analyzing post:", post, e);
            results.push({
                post,
                errors: [`Complete analysis failed: ${e}`]
            });
        }
    }

    return results;
}

// Utility function to extract post content from JSON data
export function extractPostContents(jsonData: any[]): string[] {
    return jsonData
        .filter(item => item && item.content)
        .map(item => item.content);
}

// Demo function to run complete analysis on sample data
export async function runCompleteAnalysisDemo() {
    try {
        // Import sample data
        const fs = await import('fs');
        const path = await import('path');
        const sampleDataPath = path.resolve('./data/sample_posts.json');
        const sampleDataContent = fs.readFileSync(sampleDataPath, 'utf-8');
        const sampleData = JSON.parse(sampleDataContent);

        const posts = extractPostContents(sampleData);

        console.log(`\n🚀 Running complete analysis on ${posts.length} posts...\n`);

        const results = await analyzeMultipleCompletePosts(posts);

        results.forEach((result, index) => {
            console.log(`\n📝 Post ${index + 1}:`);
            console.log(`Content: "${result.post.substring(0, 100)}${result.post.length > 100 ? '...' : ''}"`);

            if (result.title) {
                console.log(`💡 Title: "${result.title}"`);
            }

            if (result.categorization) {
                console.log(`📂 Categories: ${result.categorization.categories.join(', ')}`);
                console.log(`📋 Subcategories: ${result.categorization.subcategories.join(', ')}`);
            }

            if (result.sentiment) {
                console.log(`📈 Sentiment: ${result.sentiment}`);
            }

            if (result.errors && result.errors.length > 0) {
                console.log(`⚠️ Errors: ${result.errors.join('; ')}`);
            }

            console.log('─'.repeat(50));
        });

        console.log(`\n✅ Analysis completed for ${results.length} posts`);

    } catch (error) {
        console.error("Demo failed:", error);
    }
}
