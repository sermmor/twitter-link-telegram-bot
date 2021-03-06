import Twitter from 'twitter';
import Telegraf from 'telegraf';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, getLastTweetId, filterTweets, ResquestParams } from './utils';
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
const sixteenMinutesInMilliseconds = 960000; // 1000 milliseconds (1 second) * 60 seconds (1 minute) * 16 minutes;

let accTweets: MessageData[] = [];
let numberOfResponses: number = 0;
let nextCurrentMaxId: string | undefined = undefined;
let currentListId: string | undefined = undefined;

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
    // TL commands.
    numberOfTweetsWithLinks.forEach(telegramNumberOfTweetsWithLinks => {
        bot.command(
            `${telegramBotData.bot_tuit_command}${telegramNumberOfTweetsWithLinks}`,
            (ctx: TelegrafContext) => {
                sendTuitTLWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
            }
        );
    });

    // Lists commands.
    telegramBotData.user_lists.forEach(userMemberList => {
        numberOfTweetsWithLinks.forEach(telegramNumberOfTweetsWithLinks => {
            bot.command(
                `${userMemberList.bot_list_command}${telegramNumberOfTweetsWithLinks}`,
                (ctx: TelegrafContext) => {
                    sendTuitListWithLinksToTelegram(userData, ctx, userMemberList.list_id, telegramNumberOfTweetsWithLinks);
                }
            );
        });
    });
}

// https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses
const sendTuitListWithLinksToTelegram = (
    userData: any,
    ctx: TelegrafContext,
    list_id: string,
    numberOfTuits: number
) => {
    ctx.reply(`Lets go to work!`);
    const userTwitterData = extractTwitterData(userData);
    
    accTweets = [];
    numberOfResponses = 0;
    nextCurrentMaxId = undefined;
    currentListId = list_id;
    
    const client = new Twitter(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks, twitterListEndpoint);
};

const sendTuitTLWithLinksToTelegram = (
    userData: any,
    ctx: TelegrafContext,
    numberOfTuits: number
) => {
    ctx.reply(`Lets go to work!`);
    const userTwitterData = extractTwitterData(userData);
    
    accTweets = [];
    numberOfResponses = 0;
    nextCurrentMaxId = undefined;
    currentListId = undefined;
    
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
            ctx.reply(`I FINISHED!!! (most earlier update: ${tweets[lastIndex - 1].createdAt})`);
            ctx.replyWithVideo({ source: pathFinishedVideo });
            console.log("> Bot has finished of sending tuits with links.")
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
            numberOfResponses = numberOfResponses + tweets.length;
            allTweets = filterTweets(allTweets);
            accTweets = accTweets.concat(allTweets);
            const newNumberOfTweets = numberOfTweetsWithLinks - allTweets.length;

            let logToReply = `Until now I have get ${accTweets.length} tweets with links from a total of ${numberOfResponses} tweets.`;
            sendMessageInConsoleAndTelegram(ctx, logToReply);
            
            if (newNumberOfTweets > 0) {
                let lastTweetId = getLastTweetId(<any> tweets);
                if (nextCurrentMaxId !== lastTweetId) {
                    nextCurrentMaxId = lastTweetId;
                    logToReply = `Date last tweets: ${tweets[tweets.length - 1].created_at} (https://twitter.com/${tweets[tweets.length - 1].user.screen_name}/status/${nextCurrentMaxId}). I'm stil working on.`;
                    sendMessageInConsoleAndTelegram(ctx, logToReply);

                    // Launch getTweetsWithLinks without recursivity.
                    setTimeout(() => getTweetsWithLinks(client, ctx, userData, newNumberOfTweets, onTuitsWithLinksGetted, twitterEndpoint, nextCurrentMaxId), 0);
                } else {
                    // Maximum tweets TL number reached.
                    sendMessageInConsoleAndTelegram(ctx, "IT'S SHOWTIME!");
                    onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
                }
            } else {
                sendMessageInConsoleAndTelegram(ctx, "IT'S SHOWTIME!");
                onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
            }
        } else {
            onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint, error);
            console.error(error);
        }
    });
};

const sendMessageInConsoleAndTelegram = (ctx: TelegrafContext, logToReply: string) => {
    console.log(`> ${logToReply}`);
    ctx.reply(logToReply);
}

// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
const prepareTwitterResquestParams = (twitterEndpoint: string, currentMaxId?: string): ResquestParams => {
    let resquestParams: ResquestParams = {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    };

    if (twitterEndpoint === twitterTLEndpoint) {
        // CASE TL (not delete because if I want new params for Timeline Endpoint).
    } else if (twitterEndpoint == twitterListEndpoint) {
        resquestParams = {
            ...resquestParams,
            list_id: currentListId,
        }
    }

    return currentMaxId ? { ...resquestParams, max_id: currentMaxId, } : resquestParams;
};

const debugTweetsInFile = () => {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2);
    // writeFileSync('tuits.json', strAllTuits);
    
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2);
    // writeFileSync('tuits.json', allTuits);
};
