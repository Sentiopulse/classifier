import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// Minimal type for the shape we use from the OpenAI client so we avoid `any`.
type OpenAILike = { chat: { completions: { create(opts: unknown): Promise<any> } } };

function getClient(clientOverride?: OpenAILike): OpenAILike {
    if (clientOverride) return clientOverride;
    if (process.env.OPENAI_API_KEY) {
        return (new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) as unknown) as OpenAILike;
    }
    throw new Error("OPENAI_API_KEY is not set. Set it in the environment or pass a clientOverride.");
}

// Sentiment analysis result type
export type SentimentResult = {
    post: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
};

// Analyze multiple posts at once
export async function analyzeMultiplePosts(posts: string[], clientOverride?: OpenAILike): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];
    for (const post of posts) {
        try {
            const usedClient = clientOverride ?? getClient();

            // Updated prompt: enforce uppercase sentiments
            const prompt = `
You are a sentiment analysis system for crypto-related posts.
Classify the sentiment of the following post into one of: BULLISH, BEARISH, NEUTRAL.

Important: Always return the sentiment in uppercase letters exactly like this: BULLISH, BEARISH, NEUTRAL,
because our database stores them in uppercase.

Return only valid JSON in this format:
{
  "sentiment": "BULLISH"
}

Post: "${post}"
`;

            const response = await usedClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            const content = response.choices?.[0]?.message?.content;
            if (!content) continue;

            const candidate = extractJSONFromContent(content) ?? content;
            const parsedAny = JSON.parse(candidate) as { sentiment?: string };
            const raw = (parsedAny.sentiment ?? '').toString().toUpperCase().trim();
            if (!["BULLISH", "BEARISH", "NEUTRAL"].includes(raw)) {
                console.error("Invalid sentiment from model:", parsedAny.sentiment, "for post:", post);
                continue;
            }
            results.push({ post, sentiment: raw as "BULLISH" | "BEARISH" | "NEUTRAL" });
        } catch (e) {
            console.error("Error analyzing post:", post, e);
            continue;
        }
    }
    return results;
}

// Helper: extract JSON from content possibly containing fenced code blocks
function extractJSONFromContent(content: string | undefined): string | null {
    if (!content) return null;
    const code = /```json\s*([\s\S]*?)```/i.exec(content);
    if (code && code[1]) return code[1].trim();
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');
    const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
    if (start === -1) return null;
    const lastBrace = content.lastIndexOf('}');
    const lastBracket = content.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (end === -1 || end <= start) return null;
    return content.slice(start, end + 1);
}

// Example runner
export async function runExample() {
    const posts = [
        "Bitcoin is going to skyrocket after the halving!",
        "Ethereum might drop below $1000 soon, risky market.",
        "The market seems calm today, no major moves."
    ];

    const results = await analyzeMultiplePosts(posts);
    console.log("Sentiment Analysis Results:", JSON.stringify(results, null, 2));
}

// Run CLI example only if explicitly requested
if (process.argv.includes("--run-sentiment")) {
    runExample().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
