import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";

dotenv.config();

// Prefer IPv4 loopback by default to avoid ::1/IPv6 resolution issues on some systems
const REDIS_URL = (process.env.REDIS_URL || "redis://127.0.0.1:6379").replace("localhost", "127.0.0.1");

let client: RedisClientType | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;

  client = createClient({ url: REDIS_URL });

  client.on("error", (err: unknown) => {
    console.error("Redis Client Error:", err);
  });

  const maxRetries = 5;
  const baseDelayMs = 200; // exponential backoff base

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.connect();
      console.log("Redis connected:", REDIS_URL);
      return client;
    } catch (err) {
      console.error(`Redis connect attempt ${attempt} failed:`, err);
      if (attempt === maxRetries) {
        client = null;
        console.error("All Redis connection attempts failed.");
        throw err;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  // unreachable, but satisfy TypeScript
  throw new Error("Redis connect failed");
}

export function getRedisClient(): RedisClientType {
  if (!client) throw new Error("Redis not initialized. Call initRedis() first.");
  return client;
}
