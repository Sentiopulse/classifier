import dotenv from 'dotenv';
import { createClient, RedisClientType } from 'redis';

dotenv.config();

// Prefer IPv4 loopback by default to avoid ::1/IPv6 resolution issues on some systems
const REDIS_URL = (process.env.REDIS_URL || 'redis://127.0.0.1:6379').replace('localhost', '127.0.0.1');

function safeRedisUrlForLog(url: string) {
  try {
    const u = new URL(url);
    // show protocol, host and port only; hide auth/userinfo
    const host = u.hostname || '';
    const port = u.port ? `:${u.port}` : '';
    return `${u.protocol}//${host}${port}`;
  } catch (e) {
    // fallback: remove everything between // and @ if present
    return url.replace(/\/\/.*@/, '//');
  }
}

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;

  // If a connect is already in progress, wait for it and return the resulting client
  if (connecting) {
    try {
      await connecting;
    } catch (err) {
      // if the previous connecting attempt failed, clear it and continue to try again
    }
    if (client && client.isOpen) return client;
  }

  // Start a single connecting promise that other callers can await
  connecting = (async (): Promise<RedisClientType> => {
    const newClient = createClient({ url: REDIS_URL });

    newClient.on('error', (err: unknown) => {
      console.error('Redis Client Error:', err);
    });

    const maxRetries = 5;
    const baseDelayMs = 200; // exponential backoff base

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await newClient.connect();
        // assign to module client (cast to satisfy TS) and return the concrete client
        client = newClient as unknown as RedisClientType;
        // Clear connecting before returning so subsequent callers don't wait
        connecting = null;
        return newClient as unknown as RedisClientType;
      } catch (err) {
        console.error(`Redis connect attempt ${attempt} failed:`, err);
        // If last attempt, clean up and rethrow
        if (attempt === maxRetries) {
          try {
            // Attempt to cleanly disconnect if partially connected
            // ignore errors from disconnect
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((newClient as any).isOpen) await newClient.disconnect();
          } catch (e) {}
          client = null;
          connecting = null;
          console.error('All Redis connection attempts failed.');
          throw err;
        }
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    // unreachable, but satisfy TypeScript
    connecting = null;
    throw new Error('Redis connect failed');
  })();

  return connecting;
}

export function getRedisClient(): RedisClientType {
  if (!client || !client.isOpen) {
    throw new Error('Redis not initialized or client is closed. Call initRedis() first.');
  }

  return client;
}
