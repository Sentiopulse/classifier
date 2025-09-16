
import { initRedis } from "./redisClient.js";
import { randomUUID } from "crypto";

// Types matching your schema
type Subpost = {
  id: string;
  content: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  source: "REDDIT" | "TWITTER" | "YOUTUBE" | "TELEGRAM" | "FARCASTER";
  categories: string[];
  subcategories: string[];
  link?: string;
  createdAt: string;
  updatedAt: string;
};

type Post = {
  id: string;
  title: string;
  subposts: Subpost[];
  totalSubposts: number;
};

async function seedRedis() {
  const redisClient = await initRedis();

  // Example data: 3 posts, each with a few subposts
  const posts: Post[] = [
    {
      id: randomUUID(),
      title: "Ethereum Merge",
      subposts: [
        {
          id: randomUUID(),
          content: "The Ethereum Merge is coming soon!",
          sentiment: "BULLISH",
          source: "REDDIT",
          categories: ["Cryptocurrency", "Development & Engineering"],
          subcategories: ["Ethereum", "Merge"],
          link: "https://reddit.com/merge",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          content: "Some are worried about the Merge risks.",
          sentiment: "BEARISH",
          source: "TWITTER",
          categories: ["Cryptocurrency"],
          subcategories: ["Ethereum", "Risks"],
          link: "https://twitter.com/merge-risks",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalSubposts: 2,
    },
    {
      id: randomUUID(),
      title: "Bitcoin ETF Approval",
      subposts: [
        {
          id: randomUUID(),
          content: "Bitcoin ETF approval could bring new investors.",
          sentiment: "BULLISH",
          source: "YOUTUBE",
          categories: ["Cryptocurrency", "Market Analysis"],
          subcategories: ["Bitcoin", "ETF"],
          link: "https://youtube.com/bitcoin-etf",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          content: "Skeptics say ETF won't change much for Bitcoin.",
          sentiment: "NEUTRAL",
          source: "REDDIT",
          categories: ["Cryptocurrency"],
          subcategories: ["Bitcoin", "ETF"],
          link: "https://reddit.com/bitcoin-etf-skeptic",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalSubposts: 2,
    },
    {
      id: randomUUID(),
      title: "AI in Crypto Trading",
      subposts: [
        {
          id: randomUUID(),
          content: "AI bots are outperforming human traders this quarter.",
          sentiment: "BULLISH",
          source: "FARCASTER",
          categories: ["Artificial Intelligence (AI)", "Trading & Investing"],
          subcategories: ["AI Bots", "Crypto Trading"],
          link: "https://farcaster.xyz/ai-bots",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          content: "Some worry about AI manipulation in markets.",
          sentiment: "BEARISH",
          source: "TELEGRAM",
          categories: ["Artificial Intelligence (AI)", "Security & Privacy"],
          subcategories: ["AI Manipulation", "Market Security"],
          link: "https://t.me/ai-manipulation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          content: "AI is a tool, not a guarantee for profits.",
          sentiment: "NEUTRAL",
          source: "TWITTER",
          categories: ["Artificial Intelligence (AI)", "Trading & Investing"],
          subcategories: ["AI Bots", "Crypto Trading"],
          link: "https://twitter.com/ai-trading-neutral",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalSubposts: 3,
    },
  ];

  // Ensure counts always match the array length (avoids future drift)
  for (const p of posts) p.totalSubposts = p.subposts.length;

  try {
    await redisClient.set("postsWithSubposts", JSON.stringify(posts));
    console.log(`Redis seeding done! Seeded ${posts.length} posts (with subposts).`);
  } finally {
    try {
      await redisClient.quit();
    } catch (err) {
      console.error("Failed to disconnect Redis client:", err);
      throw err;
    }
  }
}

seedRedis();
