import { PostGroup } from './postGroup';

export const seedData: PostGroup[] = [
  {
    id: 'group1',
    posts: [
      {
        id: 'post1',
        content:
          'Empery Digital\n@EMPD_BTC\n·\n11m\nBitcoin Firsts that changed everything:\n- $4B Pizza\n- A nation bets on BTC\n- Wall Street embraces it\n- The Trillion-Dollar Club\nFrom a pizza order to reshaping global finance.\n#Bitcoin #BTC #Blockchain #EmperyDigital',
        sentiment: 'BULLISH',
        source: 'TWITTER',
        categories: ['Cryptocurrency', 'Market Analysis'],
        subcategories: ['Bitcoin', 'Milestones', 'Adoption'],
        createdAt: '2025-09-16T12:00:00.000Z',
        updatedAt: '2025-09-16T12:00:00.000Z'
      },
      {
        id: 'post2',
        content:
          "Empery Digital\n@EMPD_BTC\n·\n11m\nSome notable events in Bitcoin's history include:\n- The purchase of pizza with Bitcoin\n- A country adopting BTC\n- Increased interest from Wall Street\n- Joining the Trillion-Dollar Club\nThese milestones reflect Bitcoin's evolving role in finance.\n#Bitcoin #BTC #Blockchain #EmperyDigital",
        sentiment: 'NEUTRAL',
        source: 'TWITTER',
        categories: ['Cryptocurrency', 'Market Analysis'],
        subcategories: ['Bitcoin', 'Milestones', 'Adoption'],
        createdAt: '2025-09-16T12:00:00.000Z',
        updatedAt: '2025-09-16T12:00:00.000Z'
      },
      {
        id: 'post3',
        content:
          "Empery Digital\n@EMPD_BTC\n·\n11m\nRecent events in Bitcoin's history have raised concerns:\n- The infamous $4B pizza purchase\n- A nation risking its economy on BTC\n- Wall Street's speculative involvement\n- Entering the Trillion-Dollar Club amid volatility\nFrom a simple transaction to ongoing financial uncertainty.\n#Bitcoin #BTC #Blockchain #EmperyDigital",
        sentiment: 'BEARISH',
        source: 'TWITTER',
        categories: ['Cryptocurrency', 'Market Analysis'],
        subcategories: ['Bitcoin', 'Milestones', 'Risks'],
        createdAt: '2025-09-16T12:00:00.000Z',
        updatedAt: '2025-09-16T12:00:00.000Z'
      }
    ]
  }
];
