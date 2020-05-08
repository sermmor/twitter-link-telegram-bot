import Twitter from 'twitter';
import Telegraf from 'telegraf';
import { readFile, writeFileSync } from 'fs';
import { extractMessagesFromTweets, MessageData, getLastTweetId } from './utils';
import { extractTwitterData, TwitterData } from './twitter-data';
import { extractTelegramData, TelegramData } from './telegram-data';
import { TelegrafContext } from 'telegraf/typings/context';

const networksPath = 'build/networks.json';
const tweetsByResquest = 50; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline

let accTweets: MessageData[] = [];
let allResponseAcc: any[] = [];

readFile(networksPath, (err, data) => {
    if (err) throw err;
    const userData = JSON.parse(<string> <any> data);

    const telegramBotData: TelegramData = extractTelegramData(userData);
    const bot = new Telegraf(telegramBotData.telegram_bot_token) // Also you can use process.env.BOT_TOKEN here.

    bot.command(telegramBotData.bot_tuit_command, (ctx: TelegrafContext) => {
        const userTwitterData = extractTwitterData(userData);
        const telegramNumberOfTweetsWithLinks = 10; // TODO: Comands with 10, 20, 30,...
    
        accTweets = [];
        allResponseAcc = [];
        getTuitsWithLinks(userTwitterData, telegramNumberOfTweetsWithLinks, (tweets: MessageData[]) => {
            // Send tweets to Telegram.
            console.log("> The bot has been called.");
            tweets.forEach(tw => {
                ctx.reply(
                    `${tw.username} (${tw.handle})\n${tw.message}\nhttps://twitter.com/${tw.handle.split('@')[1]}/status/${tw.id}`
                    // `${tw.username} (${tw.handle})\n${tw.message}`
                );
            });
        });
    });
    bot.launch();

    console.log("> The bot is on.");
});

const getTuitsWithLinks = (
    userData: TwitterData,
    numberOfTweetsWithLinks: number,
    onTuitsWithLinksGetted: ((tweets: MessageData[]) => void),
    currentMaxId?: string
) => {
    const client = new Twitter(userData);
    const params: Twitter.RequestParams = prepareTwitterResquestParams(currentMaxId);

    client.get('statuses/home_timeline', params, function(error, tweets, response) {
        if (!error) {
            allResponseAcc = allResponseAcc.concat(tweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            const allTweets: MessageData[] = extractMessagesFromTweets(<any> tweets);
            accTweets = accTweets.concat(allTweets);
            const newNumberOfTweets = numberOfTweetsWithLinks - accTweets.length;

            console.log(newNumberOfTweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets > 0) {
                const newCurrentMaxId = getLastTweetId(accTweets);
                getTuitsWithLinks(userData, newNumberOfTweets, onTuitsWithLinksGetted, newCurrentMaxId);
            } else {
                debugTweetsInFile();
                onTuitsWithLinksGetted(accTweets);
            }
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
