// src/openaiClient.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
// Fail fast if the API key is missing or empty.
const rawKey = process.env.OPENAI_API_KEY;
if (!rawKey || rawKey.trim() === '') {
  throw new Error('OPENAI_API_KEY is required. Please set it in your environment.');
}

const openai = new OpenAI({
  apiKey: rawKey
});

export default openai;
