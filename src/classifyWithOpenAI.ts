import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// Minimal types for the shape we use from the OpenAI client so we avoid `any`.
type ChatMessage = { content?: string } | undefined;
type Choice = { message?: ChatMessage };
type ChatCreateResult = { choices: Choice[] };

interface ChatCompletions {
    create(opts: unknown): Promise<ChatCreateResult>;
}

export interface OpenAILike {
    chat: {
        completions: ChatCompletions;
    };
}

let client: OpenAILike | null = null;
try {
    if (process.env.OPENAI_API_KEY) {
        // The real OpenAI client has a compatible shape at runtime; cast to
        // our minimal interface for static typing.
        client = (new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) as unknown) as OpenAILike;
    }
} catch (err) {
    client = null;
}

const CATEGORIES = [
    "DeFi",
    "NFTs",
    "Trading",
    "Staking",
    "Passive Income",
    "Altcoins",
    "Market Trends",
    "Safety",
    "Tips",
    "Earning",
];

export type Categorization = { categories: string[]; subcategories: string[] };

function extractJSONFromContent(content: string | undefined): string | null {
    if (!content) return null;
    // prefer ```json code block
    const code = /```json\s*([\s\S]*?)```/i.exec(content);
    if (code && code[1]) return code[1].trim();

    // fallback: find first {...} or [...]
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

function validateCategorization(obj: unknown): obj is Categorization {
    if (!obj || typeof obj !== 'object') return false;
    const anyObj = obj as any;
    if (!Array.isArray(anyObj.categories)) return false;
    if (!Array.isArray(anyObj.categories)) return false;
    if (!Array.isArray(anyObj.subcategories)) return false;

    // categories: array of strings, each must be one of the whitelist
    const distinct = new Set<string>();
    for (const c of anyObj.categories) {
        if (typeof c !== 'string' || c.trim() === '') return false;
        if (!CATEGORIES.includes(c)) return false;
        distinct.add(c);
    }
    // enforce at most 2 distinct main categories
    if (distinct.size > 2) return false;

    // subcategories: flat array of non-empty strings
    let totalSubcats = 0;
    for (const s of anyObj.subcategories) {
        if (typeof s !== 'string' || s.trim() === '') return false;
        totalSubcats += 1;
    }
    // at least one subcategory required
    if (totalSubcats < 1) return false;
    return true;
}

export async function categorizePost(post: string, clientOverride?: OpenAILike) {
    const usedClient: OpenAILike | undefined = clientOverride ?? client ?? undefined;

    if (!usedClient) {
        throw new Error("No OpenAI client available. Set OPENAI_API_KEY or pass a clientOverride to categorizePost.");
    }
    const prompt = `
You are a post categorization system.

Main categories: ${CATEGORIES.join(", ")}.

Instructions:
1. Choose up to 2 main categories that best fit the post.
2. Provide any number of subcategory suggestions (one or more) as a flat array of strings named "subcategories". Subcategories need not be grouped in the JSON; they should be listed once each.
3. Return only valid JSON with this exact shape:
{
    "categories": ["DeFi","Safety"],
    "subcategories": ["Yield Farming","Lending Strategies","Risk Management"]
}

Be strict: do not include any explanatory text, only the JSON above (fenced ${'```json'} blocks are acceptable).

Post: "${post}"
`;

    const response = await usedClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message?.content;
    const candidate = extractJSONFromContent(raw) ?? raw ?? "";
    try {
        const parsed = JSON.parse(candidate as string);
        if (!validateCategorization(parsed)) {
            console.error("Parsed payload failed validation:", parsed);
            return null;
        }
        return parsed as Categorization;
    } catch (err) {
        console.error("Failed to parse/validate GPT output:\n", raw, "\n-> error:", err);
        return null;
    }
}

// Named function to run categorization
export async function runCategorization() {
    const post = "How to maximize yield farming returns safely in DeFi protocols";
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set. Set OPENAI_API_KEY in your environment to run real categorization.");
    }

    const result = await categorizePost(post);
    console.log("Categorization Result:", JSON.stringify(result, null, 2));
}

// Call the named function
runCategorization();
