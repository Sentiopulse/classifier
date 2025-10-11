
// src/constants.ts

export const CATEGORIES = [
  'Cryptocurrency',
  'Blockchain Technology',
  'Decentralized Finance (DeFi)',
  'Non-Fungible Tokens (NFTs)',
  'Trading & Investing',
  'Staking & Yield Farming',
  'Smart Contracts',
  'Security & Privacy',
  'Regulation & Compliance',
  'Web3 & dApps',
  'Artificial Intelligence (AI)',
  'Machine Learning (ML)',
  'Fintech',
  'Infrastructure & Scaling',
  'Market Analysis',
  'Economics',
  'Development & Engineering',
  'Research & Innovation'
] as const;

export type Category = typeof CATEGORIES[number];
