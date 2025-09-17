
import cron from 'node-cron';
import { generateTitleForPost } from './generateTitle';
import { initRedis, getRedisClient } from './redisClient';

export type Post = {
    id: string;
    content: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    source: "TWITTER" | "REDDIT" | "YOUTUBE" | "TELEGRAM" | "FARCASTER";
    categories: string[];
    subcategories: string[];
    link?: string;
    createdAt: string;
    updatedAt: string;
};

export type PostGroup = {
    id: string;
    posts: Post[];
    title?: string;
};

// Generate a title for a PostGroup by aggregating its posts' content
export async function generateTitleForPostGroup(postGroup: PostGroup): Promise<string> {
    const combinedContent = postGroup.posts.map(post => post.content).join('\n\n');
    return await generateTitleForPost(combinedContent);
}


// Fetch all PostGroups from Redis (expects a key 'PostGroup' with a JSON array, or adapt as needed)
export async function fetchPostGroupsFromRedis(): Promise<PostGroup[]> {
    await initRedis();
    const redis = getRedisClient();
    // Adjust the key if you use a different one
    const data = await redis.get('PostGroup');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse PostGroup data from Redis:', e);
        return [];
    }
}



// Reusable function to generate and log the title for all PostGroups from Redis
export async function logTitlesForAllPostGroups(context: 'CRON' | 'MANUAL' = 'MANUAL') {
    const postGroups = await fetchPostGroupsFromRedis();
    if (!postGroups.length) {
        console.log('No PostGroups found in Redis.');
        return;
    }
    for (const group of postGroups) {
        try {
            const title = await generateTitleForPostGroup(group);
            group.title = title;
            if (context === 'CRON') {
                console.log(`[CRON] Generated Title for PostGroup (id: ${group.id}) at ${new Date().toISOString()}:`, title);
            } else {
                console.log(`Title for PostGroup (id: ${group.id}):`, title);
            }
        } catch (e) {
            if (context === 'CRON') {
                console.error(`[CRON] Error generating title for PostGroup (id: ${group.id}):`, e);
            } else {
                console.error(`Error generating title for PostGroup (id: ${group.id}):`, e);
            }
        }
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