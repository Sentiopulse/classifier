import { initRedis } from "./redisClient.js";

async function checkRedisSeed() {
  const client = await initRedis();
  try {
    const posts = JSON.parse((await client.get("posts")) || "[]");
    console.log(JSON.stringify(posts));
  } catch (err) {
    console.error("Error checking Redis seed:", err);
  } finally {
    await client.disconnect();
  }
}

checkRedisSeed();
