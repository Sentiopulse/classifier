import { initRedis } from './redisClient.js';
import { getEmbeddingWithRetry } from '../test/embeddingTest.js';

function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function main() {
  const redisClient = await initRedis();
  const redisSubscriber = redisClient.duplicate();
  await redisSubscriber.connect();

  // First, let's verify keyspace notifications are enabled
  const config = await redisClient.configGet('notify-keyspace-events');

  {
    const current = config['notify-keyspace-events'] ?? '';
    const required = ['K', 'E', 'A'];
    const merged = Array.from(new Set([...current, ...required])).join('');
    if (merged !== current) {
      console.log('Merging keyspace notification flags:', merged);
      await redisClient.configSet('notify-keyspace-events', merged);
      console.log('Keyspace notifications updated.');
    }
  }

  // Also try keyspace pattern (different format)
  await redisSubscriber.pSubscribe('__keyspace@0__:posts', async (message, pattern) => {
    const lockKey = 'dedupe:lock:posts';
    const gotLock = await redisClient.set(lockKey, '1', { NX: true, PX: 10000 });
    if (!gotLock) return;
    try {
      if (message === 'set') {
        console.log('Posts key was set via keyspace, processing update...');
        const postsRaw = await redisClient.get('posts');
        if (!postsRaw) return;
        let posts: unknown;
        try {
          posts = JSON.parse(postsRaw);
        } catch (e) {
          console.error('Failed to parse posts JSON:', e);
          return;
        }
        if (!Array.isArray(posts)) {
          console.warn('Expected posts array; got:', typeof posts);
          return;
        }
        // ...existing deduplication logic...
        const latestPost = posts[posts.length - 1]; // Assume last is new
        const latestCacheKey = `emb:${latestPost.id}`;
        let latestEmbedding = await redisClient.get(latestCacheKey).then((s: any) => (s ? JSON.parse(s) : null));
        if (!latestEmbedding) {
          latestEmbedding = await getEmbeddingWithRetry(latestPost.content);
          await redisClient.set(latestCacheKey, JSON.stringify(latestEmbedding), { EX: 86400 });
        }
        console.log(latestEmbedding);

        for (let i = 0; i < posts.length - 1; i++) {
          const otherPost = posts[i];
          const otherCacheKey = `emb:${otherPost.id}`;
          let otherEmbedding = await redisClient.get(otherCacheKey).then((s: any) => (s ? JSON.parse(s) : null));
          if (!otherEmbedding) {
            otherEmbedding = await getEmbeddingWithRetry(otherPost.content);
            await redisClient.set(otherCacheKey, JSON.stringify(otherEmbedding), { EX: 86400 });
          }
          const similarity = cosineSimilarity(latestEmbedding, otherEmbedding);
          if (similarity > 0.95) {
            console.log(`Duplicate detected: ${latestPost.id} is similar to post ${otherPost.id}`);
            // Remove the duplicate post (latestPost) from the array
            const updatedPosts = posts.filter((p: any) => p.id !== latestPost.id);
            await redisClient.set('posts', JSON.stringify(updatedPosts));
            console.log(`Removed duplicate post ${latestPost.id} from Redis.`);
            break;
          }
          console.log('similarity:', similarity.toFixed(4));
        }
      }
    } finally {
      try {
        await redisClient.del(lockKey);
      } catch {}
    }
  });

  console.log('Listening for changes to posts array and deduping using embeddings...');
}

main().catch(console.error);
