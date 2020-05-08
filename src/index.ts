import Twitter from 'twitter';
import Telegraf from 'telegraf';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, getLastTweetId, filterTweets } from './utils';
import { extractTwitterData, TwitterData } from './twitter-data';
import { extractTelegramData, TelegramData } from './telegram-data';
import { TelegrafContext } from 'telegraf/typings/context';

const networksPath = 'build/networks.json';
const maxNumberOfTweetsWithLinks = 2000;
const tweetsByResquest = 200; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
const fifteenMinutesInMilliseconds = 1000 * 60 * 15;

let accTweets: MessageData[] = [];
let allResponseAcc: any[] = [];
let nextCurrentMaxId: string | undefined = undefined;

readFile(networksPath, (err, data) => {
    if (err) throw err;
    const userData = JSON.parse(<string> <any> data);

    const telegramBotData: TelegramData = extractTelegramData(userData);
    const bot = new Telegraf(telegramBotData.telegram_bot_token) // Also you can use process.env.BOT_TOKEN here.

    const numberOfTweetsWithLinks = buildNumberOfTweetsWithLinks(maxNumberOfTweetsWithLinks);
    buildBotCommands(userData, bot, telegramBotData, numberOfTweetsWithLinks);
    bot.launch();

    console.log("> The bot is ready.");
});

const buildNumberOfTweetsWithLinks = (maxSize: number): number[] => {
    const increment = 10;
    const numberOfTweetsWithLinks: number[] = [];
    for (let i = increment; i <= maxSize; i += increment) {
        numberOfTweetsWithLinks.push(i);
    }
    return numberOfTweetsWithLinks;
}

const buildBotCommands = (
    userData: any,
    bot: Telegraf<TelegrafContext>,
    telegramBotData: TelegramData,
    numberOfTweetsWithLinks: number[]
) => {
    numberOfTweetsWithLinks.forEach(telegramNumberOfTweetsWithLinks => {
        bot.command(
            `${telegramBotData.bot_tuit_command}${telegramNumberOfTweetsWithLinks}`,
            (ctx: TelegrafContext) => {
                sendTuitWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
            }
        );
    })
}

const sendTuitWithLinksToTelegram = (
    userData: any,
    ctx: TelegrafContext,
    numberOfTuits: number
) => {
    const userTwitterData = extractTwitterData(userData);
    
    accTweets = [];
    allResponseAcc = [];
    
    const client = new Twitter(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks);
};

const handleTwitsWithLinks = (
    client: Twitter,
    userData: any,
    ctx: TelegrafContext,
    numberOfTuits: number,
    tweets: MessageData[],
    error?: any
) => {
    console.log("> The bot has been called.");
    // Send tweets to Telegram (1 tweet by second).
    tweets.forEach((tw: MessageData, index: number) => {
        setTimeout(() => {
            ctx.reply(
                `${tw.username} (${tw.handle})\n${tw.message}\nhttps://twitter.com/${tw.handle.split('@')[1]}/status/${tw.id}`
                // `${tw.username} (${tw.handle})\n${tw.message}`
            );
        }, index * 1000);
    });
    if (error) {
        // https://developer.twitter.com/en/docs/basics/rate-limiting
        // https://developer.twitter.com/en/docs/tweets/timelines/faq
        ctx.reply(`Error message: [${error[0].code}] ${error[0].message}`);
        ctx.reply(`Wait until for the next 15 minutes...`);
        setTimeout(() => {
            accTweets = [];
            allResponseAcc = [];
            getTweetsWithLinks(
                client,
                ctx,
                userData,
                numberOfTuits,
                handleTwitsWithLinks,
                nextCurrentMaxId
            );
        }, fifteenMinutesInMilliseconds);
    }
}

const getTweetsWithLinks = (
    client: Twitter,
    ctx: TelegrafContext,
    userData: TwitterData,
    numberOfTweetsWithLinks: number,
    onTuitsWithLinksGetted: ((
        client: Twitter,
        userData: any,
        ctx: TelegrafContext,
        numberOfTuits: number,
        tweets: MessageData[],
        error?: any) => void),
    currentMaxId?: string
) => {
    const params: Twitter.RequestParams = prepareTwitterResquestParams(currentMaxId);

    client.get('statuses/home_timeline', params, function(error, tweets, response) {
        if (!error) {
            allResponseAcc = allResponseAcc.concat(tweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            let allTweets: MessageData[] = extractMessagesFromTweets(<any> tweets);
            allTweets = filterTweets(allTweets);
            accTweets = accTweets.concat(allTweets);
            const newNumberOfTweets = numberOfTweetsWithLinks - allTweets.length;

            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                nextCurrentMaxId = getLastTweetId(<any> tweets);
                console.log(`Last tuit: https://twitter.com/${tweets[tweets.length - 1].user.screen_name}/status/${nextCurrentMaxId}`); // TODO: COMMENT THIS, ONLY FOR DEBUG.
                console.log(`Date last tuit: ${tweets[tweets.length - 1].created_at}`);  // TODO: COMMENT THIS, ONLY FOR DEBUG.
                getTweetsWithLinks(client, ctx, userData, newNumberOfTweets, onTuitsWithLinksGetted, nextCurrentMaxId);
            } else {
                debugTweetsInFile();
                onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets);
            }
        } else {
            debugTweetsInFile();
            onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, error);
            console.error(error);
        }
    });
};

// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
const prepareTwitterResquestParams = (currentMaxId?: string) => (
    currentMaxId ? {
        count: tweetsByResquest,
        exclude_replies: true,
        max_id: currentMaxId,
        tweet_mode: 'extended',
    } : 
    {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    }
);

const debugTweetsInFile = () => {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', allTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.

    console.log(`allTuits: ${allResponseAcc.length} vs messages: ${accTweets.length}`);
};
