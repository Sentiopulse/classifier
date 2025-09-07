import { initRedis } from "./redisClient.js";
import { getEmbeddingWithRetry } from "./embeddingTest.js";

async function cosineSimilarity(a: number[], b: number[]): Promise<number> {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    return dot / (normA * normB);
}


async function main() {
    const redisClient = await initRedis();
    const redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();

    // First, let's verify keyspace notifications are enabled
    const config = await redisClient.configGet('notify-keyspace-events');

    if (!config['notify-keyspace-events'] || !config['notify-keyspace-events'].includes('K')) {
        await redisClient.configSet('notify-keyspace-events', 'KEA');
    }


    // Also try keyspace pattern (different format)
    await redisSubscriber.pSubscribe("__keyspace@0__:posts", async (message, pattern) => {

        if (message === "set") {
            console.log("Posts key was set via keyspace, processing update...");
            const postsRaw = await redisClient.get("posts");
            if (!postsRaw) return;
            const posts = JSON.parse(postsRaw);

            const latestPost = posts[posts.length - 1]; // Assume last is new
            const latestEmbedding = await getEmbeddingWithRetry(latestPost.content);
            console.log(latestEmbedding);

            for (let i = 0; i < posts.length - 1; i++) {
                const otherPost = posts[i];
                const otherEmbedding = await getEmbeddingWithRetry(otherPost.content);
                const similarity = await cosineSimilarity(latestEmbedding, otherEmbedding);
                if (similarity > 0.95) {
                    console.log(`Duplicate detected: ${latestPost.id} is similar to post ${otherPost.id}`);
                    // Remove the duplicate post (latestPost) from the array
                    const updatedPosts = posts.filter((p: any) => p.id !== latestPost.id);
                    await redisClient.set("posts", JSON.stringify(updatedPosts));
                    console.log(`Removed duplicate post ${latestPost.id} from Redis.`);
                }
                console.log(similarity);
            }
        }
    });

    console.log("Listening for changes to posts array and deduping using embeddings...");
}

main().catch(console.error);