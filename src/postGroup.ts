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


// Reusable function to generate and log the title for the first PostGroup
export async function logTitlesForAllPostGroups(context: 'CRON' | 'MANUAL' = 'MANUAL') {
    if (!postGroups.length) {
        console.log('No PostGroups found.');
        return;
    }
    for (const group of postGroups) {
        try {
            const title = await generateTitleForPostGroup(group);
            group.title = title;
            if (context === 'CRON') {
                console.log(`[CRON] Generated Title for PostGroup (id: ${group.id}) at ${new Date().toISOString()}:`, title);
            } else {
                console.log(`Title for PostGroup (id: ${group.id}):`, title);
            }
        } catch (e) {
            if (context === 'CRON') {
                console.error(`[CRON] Error generating title for PostGroup (id: ${group.id}):`, e);
            } else {
                console.error(`Error generating title for PostGroup (id: ${group.id}):`, e);
            }
        }
    }
}

// Schedule a cron job to generate and log the title for all PostGroups every 6 hours
cron.schedule('0 */6 * * *', async () => {
    await logTitlesForAllPostGroups('CRON');
});

// If this file is run directly, generate and log the title for all PostGroups
if (require.main === module) {
    logTitlesForAllPostGroups('MANUAL');
}