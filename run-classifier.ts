#!/usr/bin/env node

import { runCompleteAnalysisDemo } from './src/completePostAnalysis.js';
import { runCategorization } from './src/classifyWithOpenAI.js';
import { analyzeMultiplePosts } from './src/analyzeSentiment.js';
import { generateTitlesForPosts } from './src/generateTitle.js';

// Get command line argument
const command = process.argv[2];

async function main() {
    console.log("🤖 SentioPulse Classifier Tool");
    console.log("==============================\n");

    switch (command) {
        case 'complete':
        case 'all':
            console.log("Running complete analysis (categorization + sentiment + title generation)...");
            await runCompleteAnalysisDemo();
            break;

        case 'categorize':
        case 'category':
            console.log("Running categorization only...");
            await runCategorization();
            break;

        case 'sentiment':
            console.log("Running sentiment analysis only...");
            const samplePosts = [
                "Bitcoin is looking bullish today! 🚀",
                "Market crash incoming, sell everything now!",
                "Just reading about DeFi protocols, interesting stuff."
            ];
            const sentimentResults = await analyzeMultiplePosts(samplePosts);
            console.log("Sentiment Results:", JSON.stringify(sentimentResults, null, 2));
            break;

        case 'title':
        case 'titles':
            console.log("Running title generation only...");
            const titlePosts = [
                "Benchmarking tiny on-device ML models for edge inference — latency down 40% with the new quantization pipeline.",
                "Q2 fintech update: payments startup doubled TPV and improved take rate; unit economics are trending positive.",
                "Reading a new whitepaper on Web3 compliance and institutional custody — regulatory clarity is the next catalyst for adoption."
            ];
            const titleResults = await generateTitlesForPosts(titlePosts);
            console.log("Title Results:", JSON.stringify(titleResults, null, 2));
            break;

        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;

        default:
            console.log("No command specified. Running complete analysis by default...");
            await runCompleteAnalysisDemo();
            break;
    }
}

function showHelp() {
    console.log(`
Usage: npm run classify [command]

Commands:
  complete, all     Run complete analysis (categorization + sentiment + title generation)
  categorize        Run categorization only
  sentiment         Run sentiment analysis only
  title, titles     Run title generation only
  help              Show this help message

Examples:
  npm run classify complete
  npm run classify categorize
  npm run classify sentiment
  npm run classify title

If no command is provided, complete analysis will run by default.
`);
}

// Handle errors gracefully
main().catch((error) => {
    console.error("❌ Error running classifier:", error);
    process.exit(1);
});
