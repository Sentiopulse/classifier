#!/usr/bin/env node

import { seedDatabase, clearDatabase, verifySeeding } from './seedDatabase';

/**
 * Command-line script to seed the Upstash Redis database with mock data.
 * 
 * Usage:
 *   npx tsx src/seed.ts              # Seed the database
 *   npx tsx src/seed.ts clear        # Clear all PostGroup data
 *   npx tsx src/seed.ts verify       # Verify seeded data
 *   npx tsx src/seed.ts --help       # Show help
 */

async function main() {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();

    try {
        switch (command) {
            case 'clear':
                await clearDatabase();
                break;

            case 'verify':
                await verifySeeding();
                break;

            case '--help':
            case '-h':
            case 'help':
                showHelp();
                break;

            case undefined:
                // Default action: seed the database
                await seedDatabase();
                await verifySeeding(); // Verify after seeding
                break;

            default:
                console.error(`❌ Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }

        console.log('✨ Operation completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('💥 Operation failed:', error);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
🌱 Database Seeding Script

Usage:
  npx tsx src/seed.ts              # Seed the database with mock data
  npx tsx src/seed.ts clear        # Clear all PostGroup data (use with caution!)
  npx tsx src/seed.ts verify       # Verify that data was seeded correctly
  npx tsx src/seed.ts --help       # Show this help message

Examples:
  # Seed the database with mock post groups and posts
  npx tsx src/seed.ts

  # Clear all data before seeding fresh data
  npx tsx src/seed.ts clear && npx tsx src/seed.ts

  # Just verify what's currently in the database
  npx tsx src/seed.ts verify

Environment Requirements:
  - REDIS_URL or Upstash environment variables must be configured
  - See .env file for configuration details
`);
}

// Run the script
if (require.main === module) {
    main();
}