import type OpenAI from 'openai';
import openai from '../../openai/openaiClient.js';
import { categorizePost, type Categorization } from '../../openai/classifyWithOpenAI.js';
import { analyzeMultiplePosts } from '../../analysis/analyzeSentiment.js';
import { generateTitleForPost } from '../../analysis/generateTitle.js';

// Combined result type for complete post analysis
export type PostAnalysisResult = {
  post: string;
  title: string;
  categorization: Categorization;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  errors?: string[];
};

// Process a single post with all analysis
export async function analyzeCompletePost(post: string, clientOverride?: OpenAI): Promise<PostAnalysisResult> {
  const usedClient: OpenAI = clientOverride ?? openai;
  // Initialize with empty/default values
  const result: PostAnalysisResult = {
    post,
    title: '',
    categorization: { categories: [], subcategories: [] },
    sentiment: 'NEUTRAL',
    errors: []
  };

  // Generate title
  try {
    const title = await generateTitleForPost(post, usedClient);
    if (title === null) {
      throw new Error(`Title generation failed for post: ${post}`);
    }
    result.title = title;
  } catch (e) {
    result.errors?.push(`Title generation failed: ${e}`);
    console.error('Title generation error:', e);
  }

  // Categorize post
  try {
    const categorization = await categorizePost(post, usedClient);
    if (categorization) {
      result.categorization = categorization;
    }
  } catch (e) {
    result.errors?.push(`Categorization failed: ${e}`);
    console.error('Categorization error:', e);
  }

  // Analyze sentiment
  try {
    const sentimentResults = await analyzeMultiplePosts([post]);
    if (sentimentResults.length > 0) {
      result.sentiment = sentimentResults[0].sentiment;
    }
  } catch (e) {
    result.errors?.push(`Sentiment analysis failed: ${e}`);
    console.error('Sentiment analysis error:', e);
  }

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors.join('; '));
  }
  return result;
}
