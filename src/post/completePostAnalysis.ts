import type OpenAI from 'openai';
import openai from '../openai/openaiClient.js';
import { categorizePost, type Categorization } from '../openai/classifyWithOpenAI.js';
import { analyzeMultiplePosts } from '../analysis/analyzeSentiment.js';
import { generateTitleForPost } from '../analysis/generateTitle.js';
import { analyzeCompletePost, type PostAnalysisResult } from './analysis/completePostAnalysis.js';

// Process multiple posts with all analysis
/**
 * @param posts An array of post content strings to analyze.
 * @param clientOverride Optional OpenAI client override.
 * @returns A promise that resolves to an array of PostAnalysisResult, each containing the analysis for a post.
 * @remarks This function processes posts with a concurrency limit of 5 to avoid overwhelming the OpenAI API.
 */
export async function analyzeMultipleCompletePosts(
  posts: string[],
  clientOverride?: OpenAI
): Promise<PostAnalysisResult[]> {
  const results: PostAnalysisResult[] = [];

  const CONCURRENCY_LIMIT = 5; // Limit to 5 concurrent post analyses

  for (let i = 0; i < posts.length; i += CONCURRENCY_LIMIT) {
    const chunk = posts.slice(i, i + CONCURRENCY_LIMIT);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (post) => {
        try {
          return await analyzeCompletePost(post, clientOverride);
        } catch (e) {
          console.error('Error analyzing post:', post, e);
          return {
            post,
            title: '',
            categorization: { categories: [], subcategories: [] },
            sentiment: 'NEUTRAL',
            errors: [`Complete analysis failed: ${e}`]
          };
        }
      })
    );

    chunkResults.forEach((res) => {
      if (res.status === 'fulfilled') {
        results.push(res.value);
      } else {
        // This case should ideally be handled by the catch block within the map,
        // but as a fallback, we can push a generic error result if a promise rejects unexpectedly.
        // However, since analyzeCompletePost already handles errors and returns a result,
        // this else block might not be strictly necessary if analyzeCompletePost is robust.
        // For now, we'll assume the inner catch handles it.
      }
    });
  }

  return results;
}

// Utility function to extract post content from JSON data
export function extractPostContents(jsonData: any[]): string[] {
  return jsonData.filter((item) => item && item.content).map((item) => item.content);
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
    console.error('Demo failed:', error);
  }
}
