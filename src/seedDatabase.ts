import { initRedis, getRedisClient } from './redisClient';
import { seedData } from './seedData';
import { PostGroup } from './postGroup';

/**
 * Seeds the Upstash Redis database with mock data for PostGroups.
 * This function will clear existing PostGroup data and populate it with the seed data.
 */
export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize Redis connection
    await initRedis();
    const redis = getRedisClient();

    console.log('✅ Connected to Redis');

    // Store the seed data as post-groups data in Redis
    // Using the new key structure as required
    await redis.set('post-groups', JSON.stringify(seedData));

    console.log(`✅ Successfully seeded ${seedData.length} post group(s) to Redis`);
    console.log('📊 Seed data summary:');

    seedData.forEach((group: PostGroup, index: number) => {
      console.log(`   Group ${index + 1}: ${group.id} (${group.posts.length} posts)`);
      group.posts.forEach((post, postIndex) => {
        console.log(`     Post ${postIndex + 1}: ${post.id} - ${post.sentiment} (${post.source})`);
      });
    });

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Clears all PostGroup data from the database.
 * Use with caution - this will delete all existing post groups!
 */
export async function clearDatabase(): Promise<void> {
  try {
    console.log('🧹 Clearing PostGroup data from database...');

    await initRedis();
    const redis = getRedisClient();

    await redis.del('post-groups');

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Verifies that the seed data was properly stored by retrieving and logging it.
 */
export async function verifySeeding(): Promise<void> {
  try {
    console.log('🔍 Verifying seeded data...');

    await initRedis();
    const redis = getRedisClient();

    const data = await redis.get('post-groups');

    if (!data) {
      console.log('❌ No data found in database');
      return;
    }

    const postGroups: PostGroup[] = JSON.parse(data);

    console.log(`✅ Found ${postGroups.length} post group(s) in database:`);
    postGroups.forEach((group, index) => {
      console.log(`   Group ${index + 1}: ${group.id} (${group.posts.length} posts)`);
    });
  } catch (error) {
    console.error('❌ Error verifying seeded data:', error);
    throw error;
  }
}
