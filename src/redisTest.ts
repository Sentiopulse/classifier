import { initRedis, getRedisClient } from "./redisClient.js";

async function testRedis() {
  const client = await initRedis();

  const pong = await client.ping();
  console.log("Ping Response:", pong); // Output: "PONG" means connection success

  await client.disconnect();
}

testRedis();
