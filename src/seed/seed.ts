#!/usr/bin/env node

import { seedDatabase, clearDatabase, verifySeeding } from './seedDatabase';

/**
 * Command-line script to seed the Upstash Redis database with mock data.
 *
 * Usage:
 *   npx tsx src/seed.ts [--dry-run] [--limit <number>] # Seed the database
 *   npx tsx src/seed.ts clear                          # Clear all PostGroup data
 *   npx tsx src/seed.ts verify                         # Verify seeded data
 *   npx tsx src/seed.ts --help                         # Show help
 *
 * Options:
 *   --dry-run: If set, the script will only log actions without modifying the database.
 *              Can also be activated by setting the environment variable DRY_RUN=true.
 *   --limit <number>: Limits the number of post groups to seed.
 *
 * Examples:
 *   npx tsx src/seed.ts --dry-run --limit 5
 *   DRY_RUN=true npx tsx src/seed.ts
 */

async function main() {
  const args = process.argv.slice(2);
  let command: string | undefined;
  let dryRun = process.env.DRY_RUN === 'true';
  let limit: number | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        dryRun = true;
        break;
      case '--limit':
        if (args[i + 1] && !isNaN(Number(args[i + 1]))) {
          limit = Number(args[i + 1]);
          i++; // Skip next argument as it's the limit value
        } else {
          console.error('❌ --limit flag requires a number.');
          showHelp();
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
      case 'help':
        command = 'help';
        break;
      default:
        if (!command) {
          command = arg.toLowerCase();
        } else {
          console.error(`❌ Unknown argument: ${arg}`);
          showHelp();
          process.exit(1);
        }
        break;
    }
  }

  try {
    switch (command) {
      case 'clear':
        await clearDatabase(dryRun);
        break;

      case 'verify':
        await verifySeeding(dryRun);
        break;

      case '--help':
      case '-h':
      case 'help':
        showHelp();
        break;

      case undefined:
        // Default action: seed the database
        await seedDatabase(dryRun, limit);
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
  npx tsx src/seed.ts [--dry-run] [--limit <number>] # Seed the database with mock data
  npx tsx src/seed.ts clear                          # Clear all PostGroup data (use with caution!)
  npx tsx src/seed.ts verify                         # Verify that data was seeded correctly
  npx tsx src/seed.ts --help                         # Show this help message

Options:
  --dry-run: If set, the script will only log actions without modifying the database.
             Can also be activated by setting the environment variable DRY_RUN=true.
  --limit <number>: Limits the number of post groups to seed.

Examples:
  # Seed the database with mock post groups and posts
  npx tsx src/seed.ts

  # Seed the database in dry-run mode, limiting to 5 post groups
  npx tsx src/seed.ts --dry-run --limit 5

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
