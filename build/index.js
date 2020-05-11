"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var twitterTLEndpoint = 'statuses/home_timeline';
var twitterListEndpoint = 'lists/statuses';
var networksPath = 'build/networks.json';
var pathFinishedVideo = 'build/finished.mp4';
var pathStartedVideo = 'build/start.mp4';
var maxNumberOfTweetsWithLinks = 1000;
var tweetsByResquest = 200; // The max is 200. https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
var sixteenMinutesInMilliseconds = 960000; // 1000 milliseconds (1 second) * 60 seconds (1 minute) * 16 minutes;
var accTweets = [];
var numberOfResponses = 0;
var nextCurrentMaxId = undefined;
var currentListId = undefined;
fs_1.readFile(networksPath, function (err, data) {
    if (err)
        throw err;
    var userData = JSON.parse(data);
    var telegramBotData = telegram_data_1.extractTelegramData(userData);
    var bot = new telegraf_1.default(telegramBotData.telegram_bot_token); // Also you can use process.env.BOT_TOKEN here.
    var numberOfTweetsWithLinks = buildNumberOfTweetsWithLinks(maxNumberOfTweetsWithLinks);
    bot.start(function (ctx) {
        ctx.replyWithVideo({ source: pathStartedVideo });
    });
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
    // TL commands.
    numberOfTweetsWithLinks.forEach(function (telegramNumberOfTweetsWithLinks) {
        bot.command("" + telegramBotData.bot_tuit_command + telegramNumberOfTweetsWithLinks, function (ctx) {
            sendTuitTLWithLinksToTelegram(userData, ctx, telegramNumberOfTweetsWithLinks);
        });
    });
    // Lists commands.
    telegramBotData.user_lists.forEach(function (userMemberList) {
        numberOfTweetsWithLinks.forEach(function (telegramNumberOfTweetsWithLinks) {
            bot.command("" + userMemberList.bot_list_command + telegramNumberOfTweetsWithLinks, function (ctx) {
                sendTuitListWithLinksToTelegram(userData, ctx, userMemberList.list_id, telegramNumberOfTweetsWithLinks);
            });
        });
    });
};
// https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses
var sendTuitListWithLinksToTelegram = function (userData, ctx, list_id, numberOfTuits) {
    ctx.reply("Lets go to work!");
    var userTwitterData = twitter_data_1.extractTwitterData(userData);
    accTweets = [];
    numberOfResponses = 0;
    nextCurrentMaxId = undefined;
    currentListId = list_id;
    var client = new twitter_1.default(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks, twitterListEndpoint);
};
var sendTuitTLWithLinksToTelegram = function (userData, ctx, numberOfTuits) {
    ctx.reply("Lets go to work!");
    var userTwitterData = twitter_data_1.extractTwitterData(userData);
    accTweets = [];
    numberOfResponses = 0;
    nextCurrentMaxId = undefined;
    currentListId = undefined;
    var client = new twitter_1.default(userData);
    getTweetsWithLinks(client, ctx, userTwitterData, numberOfTuits, handleTwitsWithLinks, twitterTLEndpoint);
};
var handleTwitsWithLinks = function (client, userData, ctx, numberOfTuits, tweets, twitterEndpoint, error) {
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
            numberOfResponses = 0;
            getTweetsWithLinks(client, ctx, userData, numberOfTuits, handleTwitsWithLinks, twitterEndpoint, nextCurrentMaxId);
        }, sixteenMinutesInMilliseconds);
    }
    else {
        setTimeout(function () {
            ctx.reply("I FINISHED!!! (most earlier update: " + tweets[lastIndex - 1].createdAt + ")");
            ctx.replyWithVideo({ source: pathFinishedVideo });
            console.log("> Bot has finished of sending tuits with links.");
        }, lastIndex * 1000);
    }
};
var getTweetsWithLinks = function (client, ctx, userData, numberOfTweetsWithLinks, onTuitsWithLinksGetted, twitterEndpoint, currentMaxId) {
    var params = prepareTwitterResquestParams(twitterEndpoint, currentMaxId);
    client.get(twitterEndpoint, params, function (error, tweets, response) {
        if (!error) {
            var allTweets = utils_1.extractMessagesFromTweets(tweets);
            numberOfResponses = numberOfResponses + tweets.length;
            allTweets = utils_1.filterTweets(allTweets);
            accTweets = accTweets.concat(allTweets);
            var newNumberOfTweets_1 = numberOfTweetsWithLinks - allTweets.length;
            var logToReply = "Until now I have get " + accTweets.length + " tweets with links from a total of " + numberOfResponses + " tweets.";
            sendMessageInConsoleAndTelegram(ctx, logToReply);
            if (newNumberOfTweets_1 > 0) {
                var lastTweetId = utils_1.getLastTweetId(tweets);
                if (nextCurrentMaxId !== lastTweetId) {
                    nextCurrentMaxId = lastTweetId;
                    logToReply = "Date last tweets: " + tweets[tweets.length - 1].created_at + " (https://twitter.com/" + tweets[tweets.length - 1].user.screen_name + "/status/" + nextCurrentMaxId + "). I'm stil working on.";
                    sendMessageInConsoleAndTelegram(ctx, logToReply);
                    // Launch getTweetsWithLinks without recursivity.
                    setTimeout(function () { return getTweetsWithLinks(client, ctx, userData, newNumberOfTweets_1, onTuitsWithLinksGetted, twitterEndpoint, nextCurrentMaxId); }, 0);
                }
                else {
                    // Maximum tweets TL number reached.
                    sendMessageInConsoleAndTelegram(ctx, "IT'S SHOWTIME!");
                    onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
                }
            }
            else {
                sendMessageInConsoleAndTelegram(ctx, "IT'S SHOWTIME!");
                onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint);
            }
        }
        else {
            onTuitsWithLinksGetted(client, userData, ctx, numberOfTweetsWithLinks, accTweets, twitterEndpoint, error);
            console.error(error);
        }
    });
};
var sendMessageInConsoleAndTelegram = function (ctx, logToReply) {
    console.log("> " + logToReply);
    ctx.reply(logToReply);
};
// We are using the modern twitter API https://developer.twitter.com/en/docs/tweets/tweet-updates
var prepareTwitterResquestParams = function (twitterEndpoint, currentMaxId) {
    var resquestParams = {
        count: tweetsByResquest,
        exclude_replies: true,
        tweet_mode: 'extended',
    };
    if (twitterEndpoint === twitterTLEndpoint) {
        // CASE TL (not delete because if I want new params for Timeline Endpoint).
    }
    else if (twitterEndpoint == twitterListEndpoint) {
        resquestParams = __assign(__assign({}, resquestParams), { list_id: currentListId });
    }
    return currentMaxId ? __assign(__assign({}, resquestParams), { max_id: currentMaxId }) : resquestParams;
};
var debugTweetsInFile = function () {
    // const strAllTuits: string = JSON.stringify(accTweets, null, 2);
    // writeFileSync('tuits.json', strAllTuits);
    // const allTuits: string = JSON.stringify(allResponseAcc, null, 2);
    // writeFileSync('tuits.json', allTuits);
};
