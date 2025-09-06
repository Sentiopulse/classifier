import openai from "./openaiClient";

function mockEmbedding(input: string, dim = 1536) {
  // deterministic pseudo-random vector derived from input (safe dev fallback)
  const seed = Array.from(input).reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
  const out: number[] = new Array(dim);
  let x = seed;
  for (let i = 0; i < dim; i++) {
    // simple xorshift-ish sequence -> map to [-1,1]
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    out[i] = ((x >>> 0) % 10000) / 10000 * 2 - 1;
  }
  return out;
}

async function getEmbeddingWithRetry(input: string, opts?: { model?: string; maxRetries?: number }) {
  const model = opts?.model ?? "text-embedding-3-small";
  const maxRetries = opts?.maxRetries ?? 3;
  const baseDelay = 500; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({ model, input });
      return response.data[0].embedding;
    } catch (err: any) {
      const status = err?.status || err?.code || (err?.error && err.error?.code);
      const type = err?.error && err.error.type;

      // If user has exhausted quota, provide guidance and fallback to mock
      if (type === "insufficient_quota" || (status === 429 && err?.error?.type === "insufficient_quota")) {
        console.error("OpenAI quota exhausted:", err?.error?.message || err);
        console.error("Action: check your OpenAI billing & quota or set a different API key in OPENAI_API_KEY.");
        return mockEmbedding(input);
      }

      // Retry on transient rate limits (HTTP 429)
      if (status === 429 || type === "rate_limit" || err?.code === "rate_limit") {
        console.warn(`OpenAI rate-limited (attempt ${attempt}/${maxRetries}). Retrying...`);
        if (attempt === maxRetries) {
          console.error("Max retries reached for OpenAI. Falling back to mock embedding.");
          return mockEmbedding(input);
        }
        const delay = baseDelay * 2 ** (attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Non-retryable error: rethrow
      throw err;
    }
  }
  // fallback
  return mockEmbedding(input);
}

async function testEmbedding() {
  const input = "TypeScript makes JavaScript scalable.";
  try {
    const embedding = await getEmbeddingWithRetry(input, { model: "text-embedding-3-small", maxRetries: 3 });
    console.log("Embedding vector length:", embedding.length);
  } catch (err) {
    console.error("Failed to get embedding and fallback failed:", err);
  }
}

testEmbedding();
