# Classifier

AI engine for classifying market sentiment, topics, and trustworthiness from raw data using OpenAI and Redis.

## Features

- **Market Sentiment Analysis**: Classifies posts and data for positive, negative, or neutral sentiment.
- **Topic Classification**: Identifies and groups posts by relevant topics.
- **Trustworthiness Scoring**: Evaluates the reliability of content.
- **OpenAI Integration**: Uses OpenAI models for advanced NLP tasks.
- **Redis Support**: Caches and deduplicates processed data for efficiency.

## Project Structure

- `src/` — Main source code
  - `analyzeSentiment.ts` — Sentiment analysis logic
  - `classifyWithOpenAI.ts` — OpenAI classification integration
  - `completePostAnalysis.ts` — Full post analysis pipeline
  - `redisClient.ts`, `redisDedupeListener.ts` — Redis utilities
  - `lib/utils.ts` — Utility functions
- `data/` — Sample and seed data
- `run-classifier.ts` — Entry point for running the classifier

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Access to OpenAI API (API key required)
- Redis server (for caching/deduplication)

### Installation

1. Clone the repository:
	```bash
	git clone https://github.com/Sentiopulse/classifier.git
	cd classifier
	```
2. Install dependencies:
	```bash
	npm install
	# or
	yarn install
	```

### Configuration

Set your OpenAI API key and Redis connection details as environment variables:

```bash
export OPENAI_API_KEY=your_openai_api_key
export REDIS_URL=redis://localhost:6379
```

You can also use a `.env` file with [dotenv](https://www.npmjs.com/package/dotenv) if preferred.

### Usage

To run the classifier on sample data:

```bash
npx ts-node run-classifier.ts
```

Or build and run with Node.js:

```bash
npm run build
node dist/run-classifier.js
```

## Development

- Source code is in TypeScript (`src/`)
- Lint, test, and format code before submitting PRs

### Scripts

- `npm run build` — Compile TypeScript
- `npm run lint` — Lint code
- `npm test` — Run tests (if available)

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

See the [LICENSE](LICENSE) file for details.
