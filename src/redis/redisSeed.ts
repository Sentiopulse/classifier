import { initRedis } from './redisClient.js';
import * as fs from 'fs';
import * as path from 'path';

type InputPost = {
  id: string;
  content: string;
  url: string;
  created_at: string;
  author: { name: string; handle: string; pfpUrl: string } | null;
};

async function seedRedis() {
  const redisClient = await initRedis();

  // Try to read user-provided input from data/sample_posts.json (project root)
  const dataPath = path.resolve(process.cwd(), 'data', 'sample_posts.json');
  let inputPosts: InputPost[] = [];

  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      inputPosts = JSON.parse(raw);
      console.log(`Loaded ${inputPosts.length} posts from data/sample_posts.json`);
    } catch (err) {
      console.error('Failed to parse data/sample_posts.json, falling back to bundled sample:', err);
    }
  }

  try {
    await redisClient.set('posts', JSON.stringify(inputPosts));
    console.log(`Redis seeding done! Seeded ${inputPosts.length} posts.`);
  } finally {
    // Always attempt to close the client. If disconnect fails, surface the error
    // after attempting to close (don't swallow fatal errors silently).
    try {
      await redisClient.quit();
    } catch (err) {
      console.error('Failed to disconnect Redis client:', err);
      // rethrow so callers see the original failure if needed
      throw err;
    }
  }
}

seedRedis();
import { initRedis } from './redisClient.js';
import * as fs from 'fs';
import * as path from 'path';

type InputPost = {
  id: string;
  content: string;
  url: string;
  created_at: string;
  author: { name: string; handle: string; pfpUrl: string } | null;
};

async function seedRedis() {
  const redisClient = await initRedis();

  // Try to read user-provided input from data/sample_posts.json (project root)
  const dataPath = path.resolve(process.cwd(), 'data', 'sample_posts.json');
  let inputPosts: InputPost[] = [];

  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      inputPosts = JSON.parse(raw);
      console.log(`Loaded ${inputPosts.length} posts from data/sample_posts.json`);
    } catch (err) {
      console.error('Failed to parse data/sample_posts.json, falling back to bundled sample:', err);
    }
  }

  try {
    await redisClient.set('posts', JSON.stringify(inputPosts));
    console.log(`Redis seeding done! Seeded ${inputPosts.length} posts.`);
  } finally {
    // Always attempt to close the client. If disconnect fails, surface the error
    // after attempting to close (don't swallow fatal errors silently).
    try {
      await redisClient.quit();
    } catch (err) {
      console.error('Failed to disconnect Redis client:', err);
      // rethrow so callers see the original failure if needed
      throw err;
    }
  }
}

seedRedis();
