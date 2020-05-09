"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var twitter_1 = __importDefault(require("twitter"));
var telegraf_1 = __importDefault(require("telegraf"));
var fs_1 = require("fs");
var utils_1 = require("./utils");
var twitter_data_1 = require("./twitter-data");
var telegram_data_1 = require("./telegram-data");
var networksPath = 'build/networks.json';
var maxNumberOfTweetsWithLinks = 2000;
var tweetsByResquest = 200; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
var sixteenMinutesInMilliseconds = 1000 * 60 * 16;
var accTweets = [];
var allResponseAcc = [];
var nextCurrentMaxId = undefined;
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var userData = JSON.parse(data);
    var telegramBotData = telegram_data_1.extractTelegramData(userData);
    var bot = new telegraf_1.default(telegramBotData.telegram_bot_token); // Also you can use process.env.BOT_TOKEN here.
    var numberOfTweetsWithLinks = buildNumberOfTweetsWithLinks(maxNumberOfTweetsWithLinks);
    buildBotCommands(userData, bot, telegramBotData, numberOfTweetsWithLinks);
    bot.launch();
    console.log("> The bot is ready.");
});
var buildNumberOfTweetsWithLinks = function (maxSize) {
    var increment = 10;
    var numberOfTweetsWithLinks = [];
    for (var i = increment; i <= maxSize; i += increment) {
        numberOfTweetsWithLinks.push(i);
    }
    return numberOfTweetsWithLinks;
};
var buildBotCommands = function (userData, bot, telegramBotData, numberOfTweetsWithLinks) {
    numberOfTweetsWithLinks.forEach(function (telegramNumberOfTweetsWithLinks) {
        bot.command("" + telegramBotData.bot_tuit_command + telegramNumberOfTweetsWithLinks, function (ctx) {
            sendTuitWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
        });
    });
};
var sendTuitWithLinksToTelegram = function (userData, ctx, numberOfTuits) {
    var userTwitterData = twitter_data_1.extractTwitterData(userData);
    accTweets = [];
    allResponseAcc = [];
    var client = new twitter_1.default(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks);
};
var handleTwitsWithLinks = function (client, userData, ctx, numberOfTuits, tweets, error) {
    console.log("> The bot is going to launch a result.");
    // Send tweets to Telegram (1 tweet by second).
    var lastIndex = (tweets && tweets.length > 0) ? tweets.length : 0;
    tweets.forEach(function (tw, index) {
        setTimeout(function () {
            ctx.reply(tw.username + " (" + tw.handle + ")\n" + tw.message + "\nhttps://twitter.com/" + tw.handle.split('@')[1] + "/status/" + tw.id
            // `${tw.username} (${tw.handle})\n${tw.message}`
            );
        }, index * 1000);
    });
    if (error) {
        // https://developer.twitter.com/en/docs/basics/rate-limiting
        // https://developer.twitter.com/en/docs/tweets/timelines/faq
        setTimeout(function () {
            ctx.reply("Error message: [" + error[0].code + "] " + error[0].message);
            ctx.reply("Wait until for the next 16 minutes...");
        }, lastIndex * 1000);
        setTimeout(function () {
            accTweets = [];
            allResponseAcc = [];
            getTweetsWithLinks(client, ctx, userData, numberOfTuits, handleTwitsWithLinks, nextCurrentMaxId);
        }, sixteenMinutesInMilliseconds);
    }
};
var getTweetsWithLinks = function (client, ctx, userData, numberOfTweetsWithLinks, onTuitsWithLinksGetted, currentMaxId) {
    var params = prepareTwitterResquestParams(currentMaxId);
    client.get('statuses/home_timeline', params, function (error, tweets, response) {
        if (!error) {
            allResponseAcc = allResponseAcc.concat(tweets); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            var allTweets = utils_1.extractMessagesFromTweets(tweets);
            allTweets = utils_1.filterTweets(allTweets);
            accTweets = accTweets.concat(allTweets);
            var newNumberOfTweets_1 = numberOfTweetsWithLinks - allTweets.length;
            console.log(newNumberOfTweets_1); // TODO: COMMENT THIS, ONLY FOR DEBUG.
            if (newNumberOfTweets_1 > 0) {
                var lastTweetId = utils_1.getLastTweetId(tweets);
                if (nextCurrentMaxId !== lastTweetId) {
                    nextCurrentMaxId = lastTweetId;
                    console.log("Last tuit: https://twitter.com/" + tweets[tweets.length - 1].user.screen_name + "/status/" + nextCurrentMaxId); // TODO: COMMENT THIS, ONLY FOR DEBUG.
                    console.log("Date last tuit: " + tweets[tweets.length - 1].created_at); // TODO: COMMENT THIS, ONLY FOR DEBUG.
                    // Launch getTweetsWithLinks without recursivity.
                    setTimeout(function () { return getTweetsWithLinks(client, ctx, userData, newNumberOfTweets_1, onTuitsWithLinksGetted, nextCurrentMaxId); }, 0);
                }
                else {
                    debugTweetsInFile();
                    onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets);
                }
            }
            else {
                debugTweetsInFile();
                onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets);
            }
        }
        else {
            debugTweetsInFile();
            onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, error);
            console.error(error);
        }
    });
};
// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
var prepareTwitterResquestParams = function (currentMaxId) { return (currentMaxId ? {
    count: tweetsByResquest,
    exclude_replies: true,
    max_id: currentMaxId,
    tweet_mode: 'extended',
} :
    {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    }); };
var debugTweetsInFile = function () {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', strAllTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    // writeFileSync('tuits.json', allTuits); // TODO: COMMENT THIS, ONLY FOR DEBUG.
    console.log("allTuits: " + allResponseAcc.length + " vs messages: " + accTweets.length);
};
