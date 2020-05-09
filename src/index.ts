import Twitter from 'twitter';
import Telegraf from 'telegraf';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, getLastTweetId, filterTweets } from './utils';
import { extractTwitterData, TwitterData } from './twitter-data';
import { extractTelegramData, TelegramData } from './telegram-data';
import { TelegrafContext } from 'telegraf/typings/context';

const twitterTLEndpoint = 'statuses/home_timeline';
const twitterListEndpoint = 'lists/statuses';

const networksPath = 'build/networks.json';
const pathFinishedVideo = 'build/finished.mp4';
const pathStartedVideo = 'build/start.mp4';
const maxNumberOfTweetsWithLinks = 1000;
const tweetsByResquest = 200; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
const sixteenMinutesInMilliseconds = 1000 * 60 * 16;

let accTweets: MessageData[] = [];
let numberOfResponses: number = 0;
let nextCurrentMaxId: string | undefined = undefined;

readFile(networksPath, (err, data) => {
    if (err) throw err;
    const userData = JSON.parse(<string> <any> data);

    const telegramBotData: TelegramData = extractTelegramData(userData);
    const bot = new Telegraf(telegramBotData.telegram_bot_token) // Also you can use process.env.BOT_TOKEN here.

    const numberOfTweetsWithLinks = buildNumberOfTweetsWithLinks(maxNumberOfTweetsWithLinks);
    bot.start(ctx => {
        ctx.replyWithVideo({ source: pathStartedVideo });
    });
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
    numberOfResponses = 0;
    
    const client = new Twitter(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks, twitterTLEndpoint);
};

const handleTwitsWithLinks = (
    client: Twitter,
    userData: any,
    ctx: TelegrafContext,
    numberOfTuits: number,
    tweets: MessageData[],
    twitterEndpoint: string,
    error?: any
) => {
    console.log("> The bot is going to launch a result.");
    // Send tweets to Telegram (1 tweet by second).
    const lastIndex = (tweets && tweets.length > 0) ? tweets.length : 0;
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
        setTimeout(() => {
            ctx.reply(`Error message: [${error[0].code}] ${error[0].message}`);
            ctx.reply(`Wait until for the next 16 minutes...`);
        }, lastIndex * 1000);
        setTimeout(() => {
            accTweets = [];
            numberOfResponses = 0;
            getTweetsWithLinks(
                client,
                ctx,
                userData,
                numberOfTuits,
                handleTwitsWithLinks,
                twitterEndpoint,
                nextCurrentMaxId
            );
        }, sixteenMinutesInMilliseconds);
    } else {
        setTimeout(() => {
            ctx.reply(`FINISHED!!! (most earlier update: ${tweets[lastIndex - 1].createdAt})`);
            ctx.replyWithVideo({ source: pathFinishedVideo });
        }, lastIndex * 1000);
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
        twitterEndpoint: string,
        error?: any) => void),
    twitterEndpoint: string,
    currentMaxId?: string
) => {
    const params: Twitter.RequestParams = prepareTwitterResquestParams(twitterEndpoint, currentMaxId);

    client.get(twitterEndpoint, params, function(error, tweets, response) {
        if (!error) {
            let allTweets: MessageData[] = extractMessagesFromTweets(<any> tweets);
            numberOfResponses = numberOfResponses + tweets.length; // TODO: COMMENT THIS, ONLY FOR DEBUG.
            allTweets = filterTweets(allTweets);
            accTweets = accTweets.concat(allTweets);
            const newNumberOfTweets = numberOfTweetsWithLinks - allTweets.length;

            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                let lastTweetId = getLastTweetId(<any> tweets);
                if (nextCurrentMaxId !== lastTweetId) {
                    nextCurrentMaxId = lastTweetId;
                    console.log(`Last tuit: https://twitter.com/${tweets[tweets.length - 1].user.screen_name}/status/${nextCurrentMaxId}`); // TODO: COMMENT THIS, ONLY FOR DEBUG.
                    console.log(`Date last tuit: ${tweets[tweets.length - 1].created_at}`);  // TODO: COMMENT THIS, ONLY FOR DEBUG.
                    // Launch getTweetsWithLinks without recursivity.
                    setTimeout(() => getTweetsWithLinks(client, ctx, userData, newNumberOfTweets, onTuitsWithLinksGetted, twitterEndpoint, nextCurrentMaxId), 0);
                } else {
                    // Maximum tweets TL number reached.
                    debugTweetsInFile();
                    onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
                }
            } else {
                debugTweetsInFile();
                onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
            }
        } else {
            debugTweetsInFile();
            onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint, error);
            console.error(error);
        }
    });
};

// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
const prepareTwitterResquestParams = (twitterEndpoint: string, currentMaxId?: string) => {
    let resquestParams = {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    };

    if (twitterEndpoint === twitterTLEndpoint) {
        // ! CASE TL.
    } else if (twitterEndpoint == twitterListEndpoint) {
        // ! CASE LIST.
    }

    return currentMaxId ? { ...resquestParams, max_id: currentMaxId, } : resquestParams;
};

const debugTweetsInFile = () => {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', allTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.

    console.log(`allTuits: ${numberOfResponses} vs messages: ${accTweets.length}`);
};
