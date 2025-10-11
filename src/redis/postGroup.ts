import cron from 'node-cron';
import { generateTitleForPost, generateSentimentSummariesForGroup, type SentimentSummaries } from '../analysis/generateTitle';
import { initRedis, getRedisClient } from './redisClient';
import { Category } from '../lib/constants';

export type Post = {
  id: string;
  content: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  source: 'TWITTER' | 'REDDIT' | 'YOUTUBE' | 'TELEGRAM' | 'FARCASTER';
  categories: Category[];
  subcategories: string[];
  link?: string;
  createdAt: string;
  updatedAt: string;
};

export type PostGroup = {
  id: string;
  posts: Post[];
  title?: string;
  bullishSummary?: string;
  bearishSummary?: string;
  neutralSummary?: string;
};

// Generate a title for a PostGroup by aggregating its posts' content
export async function generateTitleForPostGroup(postGroup: PostGroup): Promise<string> {
  const combinedContent = postGroup.posts.map((post) => post.content).join('\n\n');
  return await generateTitleForPost(combinedContent);
}

// Generate sentiment summaries for a PostGroup based on its posts
export async function generateSentimentSummariesForPostGroup(postGroup: PostGroup): Promise<SentimentSummaries> {
  return await generateSentimentSummariesForGroup(postGroup.posts);
}

// Fetch all PostGroups from Redis (expects a key 'PostGroup' with a JSON array, or adapt as needed)
export async function fetchPostGroupsFromRedis(): Promise<PostGroup[]> {
  await initRedis();
  const redis = getRedisClient();
  // Adjust the key if you use a different one
  const data = await redis.get('post-groups');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse post-groups data from Redis:', e);
    return [];
  }
}

// Reusable function to generate and log the title and sentiment summaries for all PostGroups from Redis
export async function logTitlesForAllPostGroups(context: 'CRON' | 'MANUAL' = 'MANUAL') {
  const postGroups = await fetchPostGroupsFromRedis();
  if (!postGroups.length) {
    console.log('No PostGroups found in Redis.');
    return;
  }
  const postGroupsWithOrderedKeys = [];
  for (const group of postGroups) {
    try {
      // Always generate and update title
      const title = await generateTitleForPostGroup(group);
      // Always generate and update sentiment summaries
      const summaries = await generateSentimentSummariesForPostGroup(group);

      if (context === 'CRON') {
        console.log(`[CRON] Generated Title for PostGroup (id: ${group.id}) at ${new Date().toISOString()}:`, title);
      } else {
        console.log(`Title for PostGroup (id: ${group.id}):`, title);
      }

      postGroupsWithOrderedKeys.push({
        id: group.id,
        title,
        bullishSummary: summaries.bullishSummary,
        bearishSummary: summaries.bearishSummary,
        neutralSummary: summaries.neutralSummary,
        posts: group.posts
      });
    } catch (e) {
      if (context === 'CRON') {
        console.error(`[CRON] Error generating title/summaries for PostGroup (id: ${group.id}):`, e);
      } else {
        console.error(`Error generating title/summaries for PostGroup (id: ${group.id}):`, e);
      }
    }
  }
  // Always save updated PostGroups with titles and summaries back to Redis
  await initRedis();
  const redis = getRedisClient();
  await redis.set('post-groups', JSON.stringify(postGroupsWithOrderedKeys));
  if (context === 'CRON') {
    console.log('[CRON] Updated post-groups with titles and sentiment summaries saved to Redis.');
  } else {
    console.log('Updated post-groups with titles and sentiment summaries saved to Redis.');
  }
}

// Schedule a cron job to generate and log the title for all PostGroups every 6 hours
cron.schedule('0 */6 * * *', async () => {
  await logTitlesForAllPostGroups('CRON');
});

// If this file is run directly, generate and log the title for all PostGroups
if (require.main === module) {
  logTitlesForAllPostGroups('MANUAL');
}
