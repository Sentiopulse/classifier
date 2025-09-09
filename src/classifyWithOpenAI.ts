// No top-level execution. Export the runner and allow explicit CLI invocation with --run.
import type OpenAI from 'openai';
import openai from './openaiClient.js';
import { z } from 'zod';

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

// Zod schema for categorization validation
const CategorizationSchema = z.object({
    categories: z.array(z.string())
        .min(1, "At least one category is required")
        .max(2, "At most 2 categories are allowed")
        .refine((arr) => arr.every((c) => CATEGORIES.includes(c)), {
            message: "All categories must be from the allowed list",
        }),
    subcategories: z.array(z.string().min(1, "Subcategories cannot be empty strings"))
        .min(1, "At least one subcategory is required"),
});

export type Categorization = z.infer<typeof CategorizationSchema>;

export async function categorizePost(post: string, clientOverride?: OpenAI) {
    const usedClient: OpenAI = clientOverride ?? openai;
    const systemPrompt = `You are a post categorization system.

Main categories: ${CATEGORIES.join(", ")}.

Instructions:
1. Choose up to 2 main categories that best fit the post.
2. Provide any number of subcategory suggestions (one or more) as a flat array of strings named "subcategories". Subcategories need not be grouped in the JSON; they should be listed once each.
3. Return only valid JSON with this exact shape:
{
    "categories": ["DeFi","Safety"],
    "subcategories": ["Yield Farming","Lending Strategies","Risk Management"]
}

Be strict: do not include any explanatory text, only the JSON above (fenced ${'```json'} blocks are acceptable).`;

    const response = await usedClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: post }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
    });

    const raw = response.choices[0].message?.content;
    if (!raw) {
        console.error("No content returned from OpenAI");
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        const validated = CategorizationSchema.parse(parsed);
        return validated;
    } catch (err) {
        console.error("Failed to parse/validate GPT output:\n", raw, "\n-> error:", err);
        return null;
    }
}

// Named function to run categorization
export async function runCategorization() {
    const post = "How to maximize yield farming returns safely in DeFi protocols";
    const result = await categorizePost(post);
    console.log("Categorization Result:", JSON.stringify(result, null, 2));
}
