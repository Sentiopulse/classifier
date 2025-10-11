import { initRedis, getRedisClient } from '../redis/redisClient';
import { seedData } from './seedData';
import { PostGroup } from '../redis/postGroup';

/**
 * Seeds the Upstash Redis database with mock data for PostGroups.
 * This function will clear existing PostGroup data and populate it with the seed data.
 *
 * @param dryRun If true, no changes will be made to the database. Actions will only be logged.
 * @param limit Optional. Limits the number of post groups to seed.
 */
export async function seedDatabase(dryRun: boolean = false, limit?: number): Promise<void> {
  try {
    console.log(`🌱 Starting database seeding${dryRun ? ' (DRY-RUN)' : ''}...`);

    if (dryRun) {
      console.log('✅ Dry run activated. No actual database changes will be made.');
    }

    // Initialize Redis connection
    await initRedis();
    const redis = getRedisClient();

    console.log('✅ Connected to Redis');

    const dataToSeed = limit ? seedData.slice(0, limit) : seedData;

    if (dryRun) {
      console.log(`[DRY-RUN] Would attempt to seed ${dataToSeed.length} post group(s) to Redis.`);
      console.log('[DRY-RUN] Data to be seeded:', JSON.stringify(dataToSeed, null, 2));
    } else {
      // Store the seed data as post-groups data in Redis
      // Using the new key structure as required
      await redis.set('post-groups', JSON.stringify(dataToSeed));
      console.log(`✅ Successfully seeded ${dataToSeed.length} post group(s) to Redis`);
    }

    console.log('📊 Seed data summary:');

    dataToSeed.forEach((group: PostGroup, index: number) => {
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
 *
 * @param dryRun If true, no changes will be made to the database. Actions will only be logged.
 */
export async function clearDatabase(dryRun: boolean = false): Promise<void> {
  try {
    console.log(`🧹 Clearing PostGroup data from database${dryRun ? ' (DRY-RUN)' : ''}...`);

    if (dryRun) {
      console.log('[DRY-RUN] Would attempt to delete \'post-groups\' key from Redis.');
    } else {
      await initRedis();
      const redis = getRedisClient();
      await redis.del('post-groups');
      console.log('✅ Database cleared successfully');
    }
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Verifies that the seed data was properly stored by retrieving and logging it.
 *
 * @param dryRun If true, no changes will be made to the database. Actions will only be logged.
 */
export async function verifySeeding(dryRun: boolean = false): Promise<void> {
  try {
    console.log(`🔍 Verifying seeded data${dryRun ? ' (DRY-RUN)' : ''}...`);

    if (dryRun) {
      console.log('[DRY-RUN] Verification skipped in dry-run mode.');
      return;
    }

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
