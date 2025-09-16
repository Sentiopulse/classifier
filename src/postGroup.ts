import cron from 'node-cron';
import { generateTitleForPost } from './generateTitle';

export type Post = {
    id: string;
    content: string;
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
    source: "TWITTER" | "REDDIT" | "YOUTUBE" | "TELEGRAM" | "FARCASTER";
    categories: string[];
    subcategories: string[];
    link?: string;
    createdAt: string;
    updatedAt: string;
};

export type PostGroup = {
    id: string;
    posts: Post[];
    title?: string;
};

// Generate a title for a PostGroup by aggregating its posts' content
export async function generateTitleForPostGroup(postGroup: PostGroup): Promise<string> {
    const combinedContent = postGroup.posts.map(post => post.content).join('\n\n');
    return await generateTitleForPost(combinedContent);
}

//One group with several posts
const postGroups: PostGroup[] = [
    {
        id: "group1",
        posts: [
            {
                id: "post1",
                content: `Empery Digital\n@EMPD_BTC\n·\n11m\nBitcoin Firsts that changed everything:\n- $4B Pizza\n- A nation bets on BTC\n- Wall Street embraces it\n- The Trillion-Dollar Club\nFrom a pizza order to reshaping global finance.\n#Bitcoin #BTC #Blockchain #EmperyDigital`,
                sentiment: "BULLISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "Milestones", "Adoption"],
                link: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post2",
                content: `Empery Digital\n@EMPD_BTC\n·\n11m\nSome notable events in Bitcoin's history include:\n- The purchase of pizza with Bitcoin\n- A country adopting BTC\n- Increased interest from Wall Street\n- Joining the Trillion-Dollar Club\nThese milestones reflect Bitcoin's evolving role in finance.\n#Bitcoin #BTC #Blockchain #EmperyDigital`,
                sentiment: "NEUTRAL",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "Milestones", "Adoption"],
                link: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post3",
                content: `Empery Digital\n@EMPD_BTC\n·\n11m\nRecent events in Bitcoin's history have raised concerns:\n- The infamous $4B pizza purchase\n- A nation risking its economy on BTC\n- Wall Street's speculative involvement\n- Entering the Trillion-Dollar Club amid volatility\nFrom a simple transaction to ongoing financial uncertainty.\n#Bitcoin #BTC #Blockchain #EmperyDigital`,
                sentiment: "BEARISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "Milestones", "Risks"],
                link: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ]
    }
];


export default postGroups;

// Schedule a cron job to generate and log the title for the first PostGroup every 6 hours
cron.schedule('0 */6 * * *', async () => {
    const group = postGroups[0];
    if (!group) {
        console.log('No PostGroup found.');
        return;
    }
    try {
        const title = await generateTitleForPostGroup(group);
        console.log(`[CRON] Generated Title for PostGroup at ${new Date().toISOString()}:`, title);
    } catch (e) {
        console.error('[CRON] Error generating title:', e);
    }
});

// If this file is run directly, generate and log the title for the first PostGroup
if (require.main === module) {
    (async () => {
        const group = postGroups[0];
        if (!group) {
            console.log('No PostGroup found.');
            return;
        }
        try {
            const title = await generateTitleForPostGroup(group);
            console.log('Title:', title);
        } catch (e) {
            console.error('Error generating title:', e);
        }
    })();
}