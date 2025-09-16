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
                content: `Kyama ⚽\n@ElijahKyama_\n·\nSep 14\nJose Mourinho explaining to Gary Neville the difference between tactical system & principles of play. \n\n\"All the good teams they defend compact. It’s just a basic principle.”\n\nPundits blaming Amorim's system for bad defending are clueless. Football basics!\nFrom \nDavid Garcia`,
                sentiment: "NEUTRAL",
                source: "TWITTER",
                categories: ["Sports", "Football"],
                subcategories: ["Tactics", "Coaching"],
                link: "https://x.com/ElijahKyama_/status/1967278291473310073",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post2",
                content: `Cas Abbé\n@cas_abbe\n·\n2h\nYou can be short-term bearish on BTC.\n\nBut you can't be long-term bearish here.\n\nHolding above key support levels, ETF inflows are going up and new raises are happening to buy BTC.\n\nI think BTC is going to hit a new ATH within 4 weeks.`,
                sentiment: "BULLISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "ETF", "ATH"],
                link: "https://x.com/cas_abbe/status/1967887271853719835",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post3",
                content: `$BTC is getting ready to break its all-time high again.\n\nLook carefully, yes, this is the same pattern that we cannot ignore.\n\nWhenever the bullish megaphone structure has split on the chart, $BTC has burst.\n\n$BTC chooses its own path, moving forward is its nature.`,
                sentiment: "BULLISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "All-Time High", "Chart Patterns"],
                link: "https://x.com/Karman_1s/status/1967532466362806434",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post4",
                content: `$BTC Seems like getting Ready for Another Bearish Impulse..📉\n\nPossible downside Target: 98–102k zone\n\n#Crypto #Bitcoin #BTCUSD`,
                sentiment: "BEARISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "Bearish Impulse", "Price Target"],
                link: "https://x.com/CryptoFaibik/status/1967533289138163772",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post5",
                content: `Football Hub\n@FootbalIhub\n·\nSep 14\nIf Haaland scores vs United today I'll give £25 to a people who like this tweet.\n\nMake sure to be following me! ✅🙌🏻`,
                sentiment: "NEUTRAL",
                source: "TWITTER",
                categories: ["Sports", "Football"],
                subcategories: ["Haaland", "Giveaway", "Manchester United"],
                link: "https://x.com/FootbalIhub/status/1967245835546341725",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: "post6",
                content: `$BTC short term view \n\nbtc gave a 116.2k bearish SFP wick, filled CME gap.\n\n- hold above 113.8k → 118k\n- lose 113.8k → 112.5k\n- break 112.5k → doors to 108k open\n0:11 / 1:40`,
                sentiment: "BEARISH",
                source: "TWITTER",
                categories: ["Cryptocurrency", "Market Analysis"],
                subcategories: ["Bitcoin", "Bearish SFP", "Support Levels", "CME Gap"],
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